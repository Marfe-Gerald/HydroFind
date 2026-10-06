import { Router } from 'express';
import { db, FieldValue } from '../firebase';
import { requireAuth, AuthedRequest } from '../middleware/auth';

const r = Router();

r.post('/me', requireAuth, async (req: AuthedRequest, res) => {
  const { fullName, contactNumber, email } = req.body;
  if (!fullName || !contactNumber) return res.status(400).json({ error: 'Missing fields' });

  await db.doc(`users/${req.uid}`).set({
    fullName,
    contactNumber,
    email,
    role: 'customer',
    createdAt: FieldValue.serverTimestamp(),
  });
  res.status(201).json({ id: req.uid });
});

r.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  const snap = await db.doc(`users/${req.uid}`).get();
  if (!snap.exists) return res.status(404).json({ error: 'No profile' });
  res.json({ id: snap.id, ...snap.data() });
});

export default r;
