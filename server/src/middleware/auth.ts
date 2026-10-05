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

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    req.uid = decoded.uid;
    const snap = await db.doc(`users/${decoded.uid}`).get();
    req.role = snap.data()?.role;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export const requireRole = (role: 'customer' | 'rider') =>
  (req: AuthedRequest, res: Response, next: NextFunction) =>
    req.role === role ? next() : res.status(403).json({ error: `${role} only` });
