import { Router } from 'express';
import { db, FieldValue, Timestamp } from '../firebase';
import { requireAuth, requireRole, AuthedRequest } from '../middleware/auth';
import { STATION, AVG_SPEED_KMH, MIN_PUSH_INTERVAL_MS } from '../config';
import { isCoord, distanceKm, etaMinutes } from '../utils/geo';

const r = Router();
r.use(requireAuth);

const col = db.collection('orders');
const toJson = (v: any): any => {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (Array.isArray(v)) return v.map(toJson);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, toJson(x)]));
  return v;
};
const serialize = (d: FirebaseFirestore.DocumentSnapshot) => ({ id: d.id, ...toJson(d.data()) });
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

const readString = (value: unknown, max = 200) => {
  if (typeof value !== 'string') return null;
  const clean = value.trim();
  return clean && clean.length <= max ? clean : null;
};

r.post('/', requireRole('customer'), async (req: AuthedRequest, res) => {
  const { stationId, productName, unitPrice, gallons, location, paymentMethod, address, preferredTime } = req.body;
  const station = readString(stationId, 50);
  const product = readString(productName, 100);
  const payment = readString(paymentMethod, 30);
  const cleanAddress = readString(address, 200);
  const cleanPreferred = readString(preferredTime, 30);

  if (!station || !product || !payment) {
    return res.status(400).json({ error: 'Missing required order fields' });
  }

  if (typeof unitPrice !== 'number' || !Number.isFinite(unitPrice) || unitPrice <= 0) {
    return res.status(400).json({ error: 'unitPrice must be a positive number' });
  }

  if (!Number.isInteger(gallons) || gallons < 1 || gallons > 50) {
    return res.status(400).json({ error: 'gallons must be an integer between 1 and 50' });
  }

  if (!isCoord(location) || !cleanAddress || !cleanPreferred) {
    return res.status(400).json({ error: 'Invalid order payload' });
  }

  const profile = (await db.doc(`users/${req.uid}`).get()).data();
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const ref = await col.add({
    customerId: req.uid,
    customerName: profile.fullName,
    contactNumber: profile.contactNumber,
    stationId: station,
    productName: product,
    unitPrice,
    gallons,
    totalAmount: Number((unitPrice * gallons).toFixed(2)),
    location: { latitude: location.latitude, longitude: location.longitude },
    address: cleanAddress,
    preferredTime: cleanPreferred,
    paymentMethod: payment,
    riderId: null,
    riderName: null,
    status: 'pending',
    paymentStatus: 'paid',
    createdAt: FieldValue.serverTimestamp(),
    acceptedAt: null,
    deliveredAt: null,
    riderLocation: null,
  });
  res.status(201).json({ id: ref.id });
});

r.get('/pending', requireRole('rider'), async (_req, res) => {
  const snap = await col.where('status', '==', 'pending').orderBy('createdAt', 'desc').get();
  res.json(snap.docs.map(serialize));
});

r.get('/mine', requireRole('customer'), async (req: AuthedRequest, res) => {
  const snap = await col.where('customerId', '==', req.uid).orderBy('createdAt', 'desc').get();
  res.json(snap.docs.map(serialize));
});

r.get('/assigned', requireRole('rider'), async (req: AuthedRequest, res) => {
  const snap = await col.where('riderId', '==', req.uid).where('status', '==', 'on_the_way').orderBy('acceptedAt', 'desc').get();
  res.json(snap.docs.map(serialize));
});

r.get('/history', async (req: AuthedRequest, res) => {
  const query = req.role === 'rider'
    ? col.where('riderId', '==', req.uid).where('status', '==', 'delivered').orderBy('deliveredAt', 'desc')
    : col.where('customerId', '==', req.uid).where('status', 'in', ['delivered', 'cancelled']).orderBy('createdAt', 'desc');

  const snap = await query.limit(50).get();
  res.json(snap.docs.map(serialize));
});

r.patch('/:id/location', requireRole('customer'), async (req: AuthedRequest, res) => {
  const { location, address } = req.body;
  if (!isCoord(location)) return res.status(400).json({ error: 'Invalid location' });
  const ref = col.doc(String(req.params.id));
  const s = await ref.get();
  if (!s.exists || s.data()!.customerId !== req.uid) return res.status(404).json({ error: 'Not found' });
  if (s.data()!.status !== 'pending') {
    return res.status(409).json({ error: 'Location can only change while the order is pending' });
  }
  const update: Record<string, unknown> = {
    location: { latitude: location.latitude, longitude: location.longitude },
  };
  if (typeof address === 'string' && address.trim()) update.address = address.trim().slice(0, 200);
  await ref.update(update);
  res.json({ ok: true });
});

r.put('/:id/rider-location', requireRole('rider'), async (req: AuthedRequest, res) => {
  const { latitude, longitude, heading, speed } = req.body;
  if (!isCoord({ latitude, longitude })) return res.status(400).json({ error: 'Invalid location' });
  const ref = col.doc(String(req.params.id));
  const s = await ref.get();
  if (!s.exists || s.data()!.riderId !== req.uid) return res.status(404).json({ error: 'Not found' });
  const o = s.data()!;
  if (o.status !== 'on_the_way') return res.status(409).json({ error: 'Order is not on the way' });
  const last: number | undefined = o.riderLocation?.updatedAt?.toMillis?.();
  if (last && Date.now() - last < MIN_PUSH_INTERVAL_MS) {
    return res.status(429).json({ error: 'Too many updates', retryAfterMs: MIN_PUSH_INTERVAL_MS - (Date.now() - last) });
  }
  await ref.update({
    riderLocation: { latitude, longitude, heading: num(heading), speed: num(speed), updatedAt: FieldValue.serverTimestamp() },
  });
  res.json({ ok: true });
});

r.get('/:id/tracking', async (req: AuthedRequest, res) => {
  const s = await col.doc(String(req.params.id)).get();
  if (!s.exists) return res.status(404).json({ error: 'Not found' });
  const o = s.data()!;
  if (o.customerId !== req.uid && o.riderId !== req.uid) return res.status(403).json({ error: 'Forbidden' });

  const live = o.status === 'on_the_way' && o.riderLocation ? o.riderLocation : null;
  const done = o.status === 'delivered' || o.status === 'cancelled';
  // Straight-line estimates only; road routing is not included in this project.
  const km = distanceKm(live ?? STATION, o.location);
  res.json({
    orderId: s.id,
    status: o.status,
    address: o.address ?? null,
    customerLocation: o.location,
    riderLocation: live && {
      latitude: live.latitude,
      longitude: live.longitude,
      heading: live.heading ?? null,
      speed: live.speed ?? null,
      updatedAt: live.updatedAt?.toMillis?.() ?? null,
    },
    station: STATION,
    distanceKm: Math.round(km * 10) / 10,
    etaMinutes: done ? null : etaMinutes(km, AVG_SPEED_KMH),
    serverTime: Date.now(),
  });
});

r.get('/:id', async (req: AuthedRequest, res) => {
  const orderId = String(req.params.id);
  const snap = await col.doc(orderId).get();
  if (!snap.exists) return res.status(404).json({ error: 'Not found' });
  const o = snap.data()!;
  const isOwner = o.customerId === req.uid;
  const isAssignedRider = o.riderId === req.uid;
  const canViewPending = req.role === 'rider' && o.status === 'pending';
  if (!isOwner && !isAssignedRider && !canViewPending) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(serialize(snap));
});

r.patch('/:id/accept', requireRole('rider'), async (req: AuthedRequest, res) => {
  const orderId = String(req.params.id);
  const ref = col.doc(orderId);
  const riderName = (await db.doc(`users/${req.uid}`).get()).data()?.fullName;
  try {
    await db.runTransaction(async (t) => {
      const s = await t.get(ref);
      if (!s.exists || s.data()!.status !== 'pending') throw new Error('UNAVAILABLE');
      t.update(ref, {
        status: 'on_the_way',
        riderId: req.uid,
        riderName,
        acceptedAt: FieldValue.serverTimestamp(),
      });
    });
    res.json({ ok: true });
  } catch {
    res.status(409).json({ error: 'Order no longer available' });
  }
});

r.patch('/:id/deliver', requireRole('rider'), async (req: AuthedRequest, res) => {
  const orderId = String(req.params.id);
  const ref = col.doc(orderId);
  const s = await ref.get();
  if (!s.exists || s.data()!.riderId !== req.uid || s.data()!.status !== 'on_the_way')
    return res.status(409).json({ error: 'Cannot deliver this order' });
  await ref.update({ status: 'delivered', deliveredAt: FieldValue.serverTimestamp(), riderLocation: null });
  res.json({ ok: true });
});

r.patch('/:id/cancel', requireRole('customer'), async (req: AuthedRequest, res) => {
  const orderId = String(req.params.id);
  const ref = col.doc(orderId);
  const s = await ref.get();
  if (!s.exists || s.data()!.customerId !== req.uid) return res.status(403).json({ error: 'Forbidden' });
  if (s.data()!.status !== 'pending') return res.status(409).json({ error: 'Only pending orders can be cancelled' });
  await ref.update({ status: 'cancelled' });
  res.json({ ok: true });
});

r.delete('/:id', requireRole('customer'), async (req: AuthedRequest, res) => {
  const orderId = String(req.params.id);
  const ref = col.doc(orderId);
  const s = await ref.get();
  if (!s.exists || s.data()!.customerId !== req.uid || s.data()!.status !== 'pending')
    return res.status(409).json({ error: 'Only your pending orders can be deleted' });
  await ref.delete();
  res.json({ ok: true });
});

export default r;
