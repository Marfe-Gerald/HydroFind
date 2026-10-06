import 'dotenv/config';
import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'hydrofind-c959f',
});

export const db = admin.firestore();
export const adminAuth = admin.auth();
export const FieldValue = admin.firestore.FieldValue;