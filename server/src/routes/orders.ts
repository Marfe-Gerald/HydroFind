import { Router } from 'express';
import { db, FieldValue, Timestamp } from '../firebase';
import { requireAuth, requireRole, AuthedRequest } from '../middleware/auth';

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
const isCoord = (value: unknown): value is { latitude: number; longitude: number } => {
  if (!value || typeof value !== 'object') return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.latitude === 'number' &&
    typeof c.longitude === 'number' &&
    Number.isFinite(c.latitude) &&
    Number.isFinite(c.longitude) &&
    Math.abs(c.latitude as number) <= 90 &&
    Math.abs(c.longitude as number) <= 180
  );
};

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
