/**
 * blockchain.js
 * -------------
 * Thin wrapper around ethers.js that owns the provider, signer, and contract instance.
 * Every on-chain read / write goes through this module.
 */

const { ethers }   = require("ethers");
const path         = require("path");
const ABI          = require(path.join(__dirname, "..", "config", "abi.json"));

let provider, signer, contract;

function init() {
  const rpcUrl         = process.env.SEPOLIA_RPC_URL;
  const privateKey     = process.env.PRIVATE_KEY;
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!rpcUrl || !privateKey || !contractAddress) {
    throw new Error(
      "Missing env vars.  Ensure SEPOLIA_RPC_URL, PRIVATE_KEY, and CONTRACT_ADDRESS are set in .env"
    );
  }

  provider = new ethers.JsonRpcProvider(rpcUrl);
  signer   = new ethers.Wallet(privateKey, provider);
  contract = new ethers.Contract(contractAddress, ABI, signer);

  console.log("[blockchain] initialised");
  console.log("  provider  :", rpcUrl.slice(0, 40) + "…");
  console.log("  signer    :", signer.address);
  console.log("  contract  :", contractAddress);
}

// ── helpers ─────────────────────────────────────────────────────────────
function getContract() { return contract; }
function getProvider() { return provider; }
function getSigner()   { return signer;   }

// ── Issue ───────────────────────────────────────────────────────────────
/**
 * @param {string} certHash   0x-prefixed bytes32
 * @param {string} studentId  raw student ID string
 * @returns {object}  { txHash, blockNumber, issuedAt }
 */
async function issueCertOnChain(certHash, studentId) {
  const tx      = await contract.issueCertificate(certHash, studentId);
  const receipt = await tx.wait();

  // Pull the issuedAt timestamp from the receipt block
  const block   = await provider.getBlock(receipt.blockNumber);

  return {
    txHash      : receipt.hash,
    blockNumber : receipt.blockNumber,
    issuedAt    : block.timestamp,
  };
}

// ── Revoke ──────────────────────────────────────────────────────────────
/**
 * @param {string} certHash  0x-prefixed bytes32
 * @returns {object}  { txHash }
 */
async function revokeCertOnChain(certHash) {
  const tx      = await contract.revokeCertificate(certHash);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

// ── Verify ──────────────────────────────────────────────────────────────
/**
 * @param {string} certHash  0x-prefixed bytes32
 * @returns {{ exists: boolean, isValid: boolean, issuer: string, issuedAt: number }}
 */
async function verifyCertOnChain(certHash) {
  const [exists, isValid, issuer, issuedAt] = await contract.verifyCertificate(certHash);
  return {
    exists,
    isValid,
    issuer,
    issuedAt: Number(issuedAt),
  };
}

// ── Query ───────────────────────────────────────────────────────────────
async function getAllCertHashes() {
  return await contract.getAllCertHashes();   // bytes32[]
}

async function getCertsByStudent(studentId) {
  return await contract.getCertsByStudent(studentId);  // bytes32[]
}

async function getLatestBlockNumber() {
  return await provider.getBlockNumber();
}

module.exports = {
  init,
  getContract,
  getProvider,
  getSigner,
  issueCertOnChain,
  revokeCertOnChain,
  verifyCertOnChain,
  getAllCertHashes,
  getCertsByStudent,
  getLatestBlockNumber,
};
