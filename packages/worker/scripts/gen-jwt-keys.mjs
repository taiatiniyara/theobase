import { generateKeyPair, exportPKCS8, exportSPKI } from 'jose';
import { writeFileSync } from 'node:fs';

const { privateKey, publicKey } = await generateKeyPair('RS256', {
  modulusLength: 2048,
});

const privPem = await exportPKCS8(privateKey);
const pubPem = await exportSPKI(publicKey);

writeFileSync('jwt-private-key.pem', privPem + '\n');
writeFileSync('jwt-public-key.pem', pubPem + '\n');

console.log('Wrote jwt-private-key.pem and jwt-public-key.pem');
console.log('Set them as Worker secrets:');
console.log(`  npx wrangler secret put JWT_PRIVATE_KEY < jwt-private-key.pem`);
console.log(`  npx wrangler secret put JWT_PUBLIC_KEY < jwt-public-key.pem`);
console.log('Store the private key somewhere safe; it is required to sign new tokens.');
