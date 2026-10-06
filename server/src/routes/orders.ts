import { Router } from 'express';
import { db, FieldValue } from '../firebase';
import { requireAuth, requireRole, AuthedRequest } from '../middleware/auth';

const r = Router();
r.use(requireAuth);

const col = db.collection('orders');
const serialize = (d: FirebaseFirestore.DocumentSnapshot) => ({ id: d.id, ...d.data() });

r.post('/', requireRole('customer'), async (req: AuthedRequest, res) => {
  const { stationId, productName, unitPrice, gallons, location, paymentMethod } = req.body;
  const profile = (await db.doc(`users/${req.uid}`).get()).data()!;

  const ref = await col.add({
    customerId: req.uid,
    customerName: profile.fullName,
    contactNumber: profile.contactNumber,
    stationId,
    productName,
    unitPrice,
    gallons,
    totalAmount: unitPrice * gallons,
    location,
    paymentMethod,
    riderId: null,
    riderName: null,
    status: 'pending',
    paymentStatus: 'paid',
    createdAt: FieldValue.serverTimestamp(),
    acceptedAt: null,
    deliveredAt: null,
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

r.get('/:id', async (req: AuthedRequest, res) => {
  const orderId = String(req.params.id);
  const snap = await col.doc(orderId).get();
  if (!snap.exists) return res.status(404).json({ error: 'Not found' });
  const o = snap.data()!;
  if (o.customerId !== req.uid && o.riderId !== req.uid && o.status !== 'pending')
    return res.status(403).json({ error: 'Forbidden' });
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
  await ref.update({ status: 'delivered', deliveredAt: FieldValue.serverTimestamp() });
  res.json({ ok: true });
});

r.patch('/:id/cancel', requireRole('customer'), async (req: AuthedRequest, res) => {
  const orderId = String(req.params.id);
  const ref = col.doc(orderId);
  const s = await ref.get();
  if (!s.exists || s.data()!.customerId !== req.uid) return res.status(403).json({ error: 'Forbidden' });
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
