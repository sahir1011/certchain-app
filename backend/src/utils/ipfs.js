const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

/**
 * Uploads JSON metadata to IPFS via Pinata.
 * @param {object} metadata - The JSON object to upload.
 * @returns {Promise<string>} - The IPFS CID.
 */
async function uploadJSONToIPFS(metadata) {
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
        console.warn("[IPFS] Pinata credentials missing. Skipping IPFS upload.");
        return null;
    }

    try {
        const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
        const response = await axios.post(url, metadata, {
            headers: {
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_SECRET_KEY
            }
        });

        console.log("[IPFS] Uploaded JSON to Pinata:", response.data.IpfsHash);
        return response.data.IpfsHash;
    } catch (error) {
        console.error("[IPFS] Failed to upload JSON to Pinata:", error.message);
        // We generally don't want to block issuance if IPFS fails, but it's up to policy.
        // For now, return null and allow issuance to proceed on-chain.
        return null;
    }
    return null;
}


/**
 * Uploads a file buffer to IPFS via Pinata.
 * @param {Buffer} fileBuffer - The file buffer.
 * @param {string} fileName - The name of the file.
 * @returns {Promise<string>} - The IPFS CID.
 */
async function uploadFileToIPFS(fileBuffer, fileName) {
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
        console.warn("[IPFS] Pinata credentials missing. Skipping IPFS upload.");
        return null;
    }

    try {
        const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
        const data = new FormData();
        data.append('file', fileBuffer, { filename: fileName });

        const response = await axios.post(url, data, {
            maxBodyLength: "Infinity",
            headers: {
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_SECRET_KEY,
                ...data.getHeaders()
            }
        });

        console.log("[IPFS] Uploaded File to Pinata:", response.data.IpfsHash);
        return response.data.IpfsHash;
    } catch (error) {
        console.error("[IPFS] Failed to upload File to Pinata:", error.message);

    }
}

module.exports = { uploadJSONToIPFS, uploadFileToIPFS };
