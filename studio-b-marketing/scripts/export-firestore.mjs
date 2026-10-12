import { readFile, writeFile } from 'node:fs/promises';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const credentialsPath = process.env.FIREBASE_SERVICE_ACCOUNT_FILE;
const outputPath = process.env.FIRESTORE_EXPORT_FILE;

if (!credentialsPath || !outputPath) {
  throw new Error('Defina FIREBASE_SERVICE_ACCOUNT_FILE e FIRESTORE_EXPORT_FILE.');
}

const serviceAccount = JSON.parse(await readFile(credentialsPath, 'utf8'));
const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app, process.env.FIRESTORE_DATABASE_ID);

const serialize = (value) => {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, serialize(entry)]));
  }
  return value;
};

const collections = await db.listCollections();
const exportData = {};

for (const collection of collections) {
  const snapshot = await collection.get();
  exportData[collection.id] = snapshot.docs.map((document) => ({
    id: document.id,
    ...serialize(document.data()),
  }));
}

await writeFile(outputPath, JSON.stringify(exportData, null, 2), { encoding: 'utf8', mode: 0o600 });
console.log(JSON.stringify(Object.fromEntries(Object.entries(exportData).map(([name, records]) => [name, records.length]))));
