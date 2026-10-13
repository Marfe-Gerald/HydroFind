import { Router } from 'express';
import { db, FieldValue } from '../firebase';
import { requireAuth, AuthedRequest } from '../middleware/auth';

const r = Router();

const normalizeRole = (role: unknown): 'customer' | 'rider' => (role === 'rider' ? 'rider' : 'customer');

r.post('/me', requireAuth, async (req: AuthedRequest, res) => {
  const { fullName, contactNumber, email, role, riderCode } = req.body;
  const safeFullName = typeof fullName === 'string' ? fullName.trim() : '';
  const safeContact = typeof contactNumber === 'string' ? contactNumber.trim() : '';

  if (!safeFullName || !safeContact) return res.status(400).json({ error: 'Missing fields' });
  if (safeFullName.length > 100 || safeContact.length > 40) {
    return res.status(400).json({ error: 'Fields are too long' });
  }

  const targetRole = normalizeRole(role);
  if (targetRole === 'rider') {
    const expected = process.env.RIDER_SIGNUP_CODE;
    if (!expected || String(riderCode ?? '') !== expected) {
      return res.status(403).json({ error: 'Invalid rider code' });
    }
  }

  try {
    await db.doc(`users/${req.uid}`).create({
      fullName: safeFullName,
      contactNumber: safeContact,
      email: typeof email === 'string' ? email : null,
      role: targetRole,
      createdAt: FieldValue.serverTimestamp(),
    });
    res.status(201).json({ id: req.uid });
  } catch (e: any) {
    if (e?.code === 6 || e?.code === 'already-exists' || e?.code === 'ALREADY_EXISTS') {
      return res.status(409).json({ error: 'Profile already exists' });
    }
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
