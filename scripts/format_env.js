const fs = require('fs');
const path = require('path');

const envPath = path.resolve('.env');
const content = fs.readFileSync(envPath, 'utf8');

function getVal(regex) {
  const m = content.match(regex);
  return m ? m[1].trim() : null;
}

const apiKey = getVal(/apiKey:\s*["']([^"']+)["']/);
const authDomain = getVal(/authDomain:\s*["']([^"']+)["']/);
const projectId = getVal(/projectId:\s*["']([^"']+)["']/);
const storageBucket = getVal(/storageBucket:\s*["']([^"']+)["']/);
const messagingSenderId = getVal(/messagingSenderId:\s*["']([^"']+)["']/);
const appId = getVal(/appId:\s*["']([^"']+)["']/);

const serviceAccountFile = 'invoicecraftstudio-firebase-adminsdk-fbsvc-d4ba57101f.json';

const additions = [];

if (!content.includes('FIREBASE_SERVICE_ACCOUNT_PATH=')) {
  additions.push(`FIREBASE_SERVICE_ACCOUNT_PATH=${serviceAccountFile}`);
}

if (!content.includes('NEXT_PUBLIC_FIREBASE_API_KEY=') && apiKey) {
  additions.push(`NEXT_PUBLIC_FIREBASE_API_KEY=${apiKey}`);
}
if (!content.includes('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=') && authDomain) {
  additions.push(`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${authDomain}`);
}
if (!content.includes('NEXT_PUBLIC_FIREBASE_PROJECT_ID=') && projectId) {
  additions.push(`NEXT_PUBLIC_FIREBASE_PROJECT_ID=${projectId}`);
}
if (!content.includes('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=') && storageBucket) {
  additions.push(`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${storageBucket}`);
}
if (!content.includes('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=') && messagingSenderId) {
  additions.push(`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${messagingSenderId}`);
}
if (!content.includes('NEXT_PUBLIC_FIREBASE_APP_ID=') && appId) {
  additions.push(`NEXT_PUBLIC_FIREBASE_APP_ID=${appId}`);
}

if (additions.length > 0) {
  const newContent = content + '\n\n# --- Next.js Firebase Environment Variables ---\n' + additions.join('\n') + '\n';
  fs.writeFileSync(envPath, newContent, 'utf8');
  console.log('Successfully formatted .env with required Next.js keys (' + additions.length + ' additions)');
} else {
  console.log('.env already contains all required formatted keys');
}
