import { Router } from 'express';
import { db, FieldValue } from '../firebase';
import { requireAuth, requireRole, AuthedRequest } from '../middleware/auth';
import { STATION, AVG_SPEED_KMH, MIN_PUSH_INTERVAL_MS, CATALOG, MAX_GALLONS } from '../config';
import { isCoord, distanceKm, etaMinutes } from '../utils/geo';
import { serializeOrder as serialize } from '../utils/serialize';

const r = Router();
r.use(requireAuth);

const col = db.collection('orders');

// Thrown inside transactions so the route can answer with the right status code.
class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
const sendError = (res: any, e: unknown) => {
  if (e instanceof HttpError) return res.status(e.status).json({ error: e.message });
  throw e; // Express 5 forwards this to the 500 handler
};

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

  // Never trust client pricing: product, station and price must match the server catalog.
  if (station !== CATALOG.stationId || product !== CATALOG.productName) {
    return res.status(400).json({ error: 'Unknown station or product' });
  }
  if (unitPrice !== CATALOG.unitPrice) {
    return res.status(400).json({ error: 'Price has changed, please refresh and try again' });
  }

  if (!Number.isInteger(gallons) || gallons < 1 || gallons > MAX_GALLONS) {
    return res.status(400).json({ error: `gallons must be an integer between 1 and ${MAX_GALLONS}` });
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
    unitPrice: CATALOG.unitPrice,
    gallons,
    totalAmount: Number((CATALOG.unitPrice * gallons).toFixed(2)),
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
  try {
    await db.runTransaction(async (t) => {
      const s = await t.get(ref);
      if (!s.exists || s.data()!.customerId !== req.uid) throw new HttpError(404, 'Not found');
      if (s.data()!.status !== 'pending') {
        throw new HttpError(409, 'Location can only change while the order is pending');
      }
      const update: Record<string, unknown> = {
        location: { latitude: location.latitude, longitude: location.longitude },
      };
      if (typeof address === 'string' && address.trim()) update.address = address.trim().slice(0, 200);
      t.update(ref, update);
    });
    res.json({ ok: true });
  } catch (e) {
    sendError(res, e);
  }
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
  const ref = col.doc(String(req.params.id));
  const riderName = (await db.doc(`users/${req.uid}`).get()).data()?.fullName ?? null;
  try {
    await db.runTransaction(async (t) => {
      const s = await t.get(ref);
      if (!s.exists || s.data()!.status !== 'pending') throw new HttpError(409, 'Order no longer available');
      // One active delivery per rider.
      const active = await t.get(
        col.where('riderId', '==', req.uid).where('status', '==', 'on_the_way').limit(1)
      );
      if (!active.empty) throw new HttpError(409, 'Finish your current delivery before accepting another');
      t.update(ref, {
        status: 'on_the_way',
        riderId: req.uid,
        riderName,
        acceptedAt: FieldValue.serverTimestamp(),
      });
    });
    res.json({ ok: true });
  } catch (e) {
    sendError(res, e);
  }
});

r.patch('/:id/deliver', requireRole('rider'), async (req: AuthedRequest, res) => {
  const ref = col.doc(String(req.params.id));
  try {
    await db.runTransaction(async (t) => {
      const s = await t.get(ref);
      if (!s.exists || s.data()!.riderId !== req.uid) throw new HttpError(404, 'Not found');
      if (s.data()!.status !== 'on_the_way') throw new HttpError(409, 'Cannot deliver this order');
      t.update(ref, { status: 'delivered', deliveredAt: FieldValue.serverTimestamp(), riderLocation: null });
    });
    res.json({ ok: true });
  } catch (e) {
    sendError(res, e);
  }
});

// Transactional so a customer cancelling cannot overwrite a rider accepting at the same moment.
r.patch('/:id/cancel', requireRole('customer'), async (req: AuthedRequest, res) => {
  const ref = col.doc(String(req.params.id));
  try {
    await db.runTransaction(async (t) => {
      const s = await t.get(ref);
      if (!s.exists || s.data()!.customerId !== req.uid) throw new HttpError(404, 'Not found');
      if (s.data()!.status !== 'pending' && s.data()!.status !== 'on_the_way') {
        throw new HttpError(409, 'Only undelivered orders can be cancelled');
      }
      t.update(ref, { status: 'cancelled', riderLocation: null });
    });
    res.json({ ok: true });
  } catch (e) {
    sendError(res, e);
  }
});

r.delete('/:id', requireRole('customer'), async (req: AuthedRequest, res) => {
  const ref = col.doc(String(req.params.id));
  try {
    await db.runTransaction(async (t) => {
      const s = await t.get(ref);
      if (!s.exists || s.data()!.customerId !== req.uid) throw new HttpError(404, 'Not found');
      if (s.data()!.status !== 'pending') throw new HttpError(409, 'Only your pending orders can be deleted');
      t.delete(ref);
    });
    res.json({ ok: true });
  } catch (e) {
    sendError(res, e);
  }
});

export default r;
