const HASH_SECRET = process.env.HASH_SECRET || process.env.NEXTAUTH_SECRET;

async function stringToBuffer(str: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

async function bufferToHex(buffer: ArrayBuffer): Promise<string> {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function generatePaymentHash(sessionId: string, orderId: string): Promise<string> {
  const message = `${sessionId}:${orderId}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const keyData = encoder.encode(HASH_SECRET);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    data
  );
  
  return bufferToHex(signature);
}

export async function verifyPaymentHash(sessionId: string, orderId: string, hash: string): Promise<boolean> {
  const expectedHash = await generatePaymentHash(sessionId, orderId);
  return expectedHash === hash;
} 