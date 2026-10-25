import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';

// Credential lookup order:
//   1. FIREBASE_SERVICE_ACCOUNT  - the full JSON as a single env var (use this on Render)
//   2. /etc/secrets/serviceAccountKey.json - Render "Secret File" (alternative on Render)
//   3. server/serviceAccountKey.json - local development only (gitignored)
function loadServiceAccount(): admin.ServiceAccount & { project_id: string } {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }
  const candidates = [
    '/etc/secrets/serviceAccountKey.json',
    path.resolve(__dirname, '../serviceAccountKey.json'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  throw new Error(
    'Firebase credentials not found. Set FIREBASE_SERVICE_ACCOUNT (full JSON) or add server/serviceAccountKey.json.'
  );
}

const serviceAccount = loadServiceAccount();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

export const db = admin.firestore();
export const adminAuth = admin.auth();
export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;
