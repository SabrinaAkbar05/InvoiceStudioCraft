const fs = require('fs');
const path = require('path');

const envPath = path.resolve('.env');
if (!fs.existsSync(envPath)) {
  console.log('.env does not exist');
  process.exit(1);
}

const content = fs.readFileSync(envPath, 'utf8');

function getVal(regex) {
  const m = content.match(regex);
  return m ? m[1].trim() : null;
}

const cName = getVal(/CLOUDINARY_CLOUD_NAME\s*=\s*([^\r\n]+)/);
const cKey = getVal(/CLOUDINARY_API_KEY\s*=\s*([^\r\n]+)/);
const cSec = getVal(/CLOUDINARY_API_SECRET\s*=\s*([^\r\n]+)/);

const apiKey = getVal(/apiKey:\s*["']([^"']+)["']/) || getVal(/NEXT_PUBLIC_FIREBASE_API_KEY\s*=\s*([^\r\n]+)/) || getVal(/VITE_FIREBASE_API_KEY\s*=\s*([^\r\n]+)/);
const authDomain = getVal(/authDomain:\s*["']([^"']+)["']/) || getVal(/NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN\s*=\s*([^\r\n]+)/) || getVal(/VITE_FIREBASE_AUTH_DOMAIN\s*=\s*([^\r\n]+)/);
const projectId = getVal(/projectId:\s*["']([^"']+)["']/) || getVal(/NEXT_PUBLIC_FIREBASE_PROJECT_ID\s*=\s*([^\r\n]+)/) || getVal(/VITE_FIREBASE_PROJECT_ID\s*=\s*([^\r\n]+)/);
const storageBucket = getVal(/storageBucket:\s*["']([^"']+)["']/) || getVal(/NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET\s*=\s*([^\r\n]+)/) || getVal(/VITE_FIREBASE_STORAGE_BUCKET\s*=\s*([^\r\n]+)/);
const messagingSenderId = getVal(/messagingSenderId:\s*["']([^"']+)["']/) || getVal(/NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID\s*=\s*([^\r\n]+)/) || getVal(/VITE_FIREBASE_MESSAGING_SENDER_ID\s*=\s*([^\r\n]+)/);
const appId = getVal(/appId:\s*["']([^"']+)["']/) || getVal(/NEXT_PUBLIC_FIREBASE_APP_ID\s*=\s*([^\r\n]+)/) || getVal(/VITE_FIREBASE_APP_ID\s*=\s*([^\r\n]+)/);

console.log(JSON.stringify({
  CLOUDINARY_CLOUD_NAME: !!cName,
  CLOUDINARY_API_KEY: !!cKey,
  CLOUDINARY_API_SECRET: !!cSec,
  NEXT_PUBLIC_FIREBASE_API_KEY: !!apiKey,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: !!authDomain,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: !!projectId,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: !!storageBucket,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: !!messagingSenderId,
  NEXT_PUBLIC_FIREBASE_APP_ID: !!appId
}, null, 2));
