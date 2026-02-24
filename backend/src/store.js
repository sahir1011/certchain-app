/**
 * store.js
 * --------
 * Database wrapper for Certificate operations.
 * Maps the application's "record" format to the Sequelize "Certificate" model.
 */

const { Certificate } = require("./models");

/**
 * Maps a Sequelize Certificate instance to the application record format.
 */
function toRecord(cert) {
  if (!cert) return null;
  const data = cert.toJSON();
  const metadata = data.metadata || {};

  return {
    certificateHash: data.certificateHash,
    studentName: metadata.studentName || "",
    studentId: data.studentId,
    courseName: data.courseName,
    institutionName: data.institutionName,
    issuanceDate: data.issuanceDate,
    expiryDate: metadata.expiryDate || "",
    grade: data.grade,
    isValid: data.status === 'issued',
    issuerAddress: metadata.issuerAddress || "",
    txHash: data.txHash,
    blockNumber: data.blockNumber,
    timestamp: data.issuedAt,
    ipfsHash: data.ipfsHash,
    imageIpfsHash: data.imageIpfsHash, // Include image IPFS hash in record
    ...metadata // Spread other metadata fields
  };
}

async function set(certHash, record) {
  try {
    await Certificate.create({
      certificateHash: record.certificateHash,
      studentId: record.studentId,
      courseName: record.courseName,
      institutionName: record.institutionName,
      issuanceDate: record.issuanceDate,
      grade: record.grade,
      txHash: record.txHash,
      blockNumber: record.blockNumber,
      status: record.isValid ? 'issued' : 'revoked',
      issuedAt: record.timestamp, // Assuming timestamp is Date or compatible
      metadata: {
        studentName: record.studentName,
        expiryDate: record.expiryDate,
        issuerAddress: record.issuerAddress,
        ipfsHash: record.ipfsHash // Storing here or in column
      },
      ipfsHash: record.ipfsHash || null,
      imageIpfsHash: record.imageIpfsHash || null // Saving image IPFS hash
    });
  } catch (e) {
    console.error(`[store] Failed to save certificate ${certHash}:`, e);
    throw e;
  }
}

async function get(certHash) {
  try {
    const cert = await Certificate.findOne({ where: { certificateHash: certHash } });
    return toRecord(cert);
  } catch (e) {
    console.error(`[store] Failed to get certificate ${certHash}:`, e);
    return null; // Return null on error to match map behavior
  }
}

async function getAll() {
  try {
    const certs = await Certificate.findAll();
    return certs.map(toRecord);
  } catch (e) {
    console.error("[store] Failed to get all certificates:", e);
    return [];
  }
}

async function getByStudent(studentId) {
  try {
    const certs = await Certificate.findAll({ where: { studentId } });
    return certs.map(toRecord);
  } catch (e) {
    console.error(`[store] Failed to get certificates for student ${studentId}:`, e);
    return [];
  }
}

async function size() {
  return await Certificate.count();
}

async function clear() {
  await Certificate.destroy({ truncate: true });
}

module.exports = { set, get, getAll, getByStudent, size, clear };

