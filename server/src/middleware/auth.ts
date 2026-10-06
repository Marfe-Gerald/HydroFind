import { Request, Response, NextFunction } from 'express';
import { adminAuth, db } from '../firebase';

export interface AuthedRequest extends Request {
  uid?: string;
  role?: 'customer' | 'rider';
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });

  let uid: string;
  try {
    uid = (await adminAuth.verifyIdToken(token)).uid;
  } catch (e) {
    console.error('verifyIdToken failed:', e);
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    req.uid = uid;
    const snap = await db.doc(`users/${uid}`).get();
    req.role = snap.data()?.role;
    next();
  } catch (e) {
    // Firestore problem (credentials, database not created, etc.) - not a token problem
    console.error('Firestore read failed:', e);
    res.status(500).json({ error: 'Database error - check server logs' });
  }
}

export const requireRole = (role: 'customer' | 'rider') =>
  (req: AuthedRequest, res: Response, next: NextFunction) =>
    req.role === role ? next() : res.status(403).json({ error: `${role} only` });
