import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';

// Load the service account key directly (no GOOGLE_APPLICATION_CREDENTIALS env var needed).
// Put serviceAccountKey.json in the server/ folder (next to package.json).
const keyPath = path.resolve(__dirname, '../serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

export const db = admin.firestore();
export const adminAuth = admin.auth();
export const FieldValue = admin.firestore.FieldValue;
