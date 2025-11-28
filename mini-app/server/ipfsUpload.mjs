// IPFS upload helper for Pinata SDK v2 (Node.js compatible)
import { PinataSDK } from 'pinata';
import { Blob } from 'buffer';

let pinata = null;

function getPinata() {
  if (!pinata) {
    if (!process.env.PINATA_JWT) {
      throw new Error('PINATA_JWT not configured. Add it to your .env file');
    }
    pinata = new PinataSDK({
      pinataJwt: process.env.PINATA_JWT,
      pinataGateway: process.env.PINATA_GATEWAY || 'gateway.pinata.cloud',
    });
  }
  return pinata;
}

/**
 * Upload a buffer to IPFS via Pinata
 * @param {Buffer} buffer - The file buffer
 * @param {string} filename - The filename
 * @param {string} mimeType - The MIME type
 * @returns {Promise<{IpfsHash: string}>}
 */
export async function uploadBufferToIPFS(buffer, filename, mimeType = 'application/octet-stream') {
  const sdk = getPinata();

  // Convert buffer to Blob (File is not needed, Blob works directly)
  const blob = new Blob([buffer], { type: mimeType });

  // Upload using the correct Pinata SDK v2 API
  const result = await sdk.upload.file(blob);

  return result;
}

/**
 * Upload JSON to IPFS via Pinata
 * @param {object} json - The JSON object
 * @param {string} name - The name for the pin (optional)
 * @returns {Promise<{IpfsHash: string}>}
 */
export async function uploadJSONToIPFS(json, name = 'metadata.json') {
  const sdk = getPinata();

  // Upload using the correct Pinata SDK v2 API
  const result = await sdk.upload.json(json);

  return result;
}

/**
 * Upload a base64 image to IPFS
 * @param {string} base64Data - Base64 encoded image (with or without data URI prefix)
 * @param {string} filename - The filename
 * @returns {Promise<{IpfsHash: string}>}
 */
export async function uploadBase64ImageToIPFS(base64Data, filename) {
  // Remove data URI prefix if present
  const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');

  // Convert base64 to buffer
  const buffer = Buffer.from(cleanBase64, 'base64');

  // Use the buffer upload method (which uses stream internally)
  const result = await uploadBufferToIPFS(buffer, filename, 'image/png');

  return result;
}

export default {
  uploadBufferToIPFS,
  uploadJSONToIPFS,
  uploadBase64ImageToIPFS,
  getPinata,
};
