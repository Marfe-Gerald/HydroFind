import { Router } from 'express';
import { db, FieldValue } from '../firebase';
import { requireAuth, AuthedRequest } from '../middleware/auth';

const r = Router();

r.post('/me', requireAuth, async (req: AuthedRequest, res) => {
  const { fullName, contactNumber, email, role } = req.body;
  if (!fullName || !contactNumber) return res.status(400).json({ error: 'Missing fields' });

  try {
    await db.doc(`users/${req.uid}`).set({
      fullName,
      contactNumber,
      email,
      role: role === 'rider' ? 'rider' : 'customer',
      createdAt: FieldValue.serverTimestamp(),
    });
    res.status(201).json({ id: req.uid });
  } catch (e) {
    console.error('Failed to save profile:', e);
    res.status(500).json({ error: 'Could not save profile - check server logs' });
  }
});

r.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  const snap = await db.doc(`users/${req.uid}`).get();
  if (!snap.exists) return res.status(404).json({ error: 'No profile' });
  res.json({ id: snap.id, ...snap.data() });
});

export default r;
