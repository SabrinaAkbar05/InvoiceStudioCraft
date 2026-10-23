const { loadEnvConfig } = require('@next/env');
const projectDir = process.cwd();
const res = loadEnvConfig(projectDir);
const keys = Object.keys(process.env).filter(k => k.includes('FIREBASE') || k.includes('CLOUDINARY'));
console.log('Keys loaded by Next env loader:', keys);
