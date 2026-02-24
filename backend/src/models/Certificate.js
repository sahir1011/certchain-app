const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Certificate = sequelize.define('Certificate', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    certificateHash: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    studentId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    courseName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    institutionName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    issuanceDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    grade: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ipfsHash: {
        type: DataTypes.STRING,
        allowNull: true // Might not be available immediately if upload fails but chain succeeds (rare)
    },
    imageIpfsHash: {
        type: DataTypes.STRING,
        allowNull: true
    },
    txHash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    blockNumber: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('issued', 'revoked'),
        defaultValue: 'issued'
    },
    metadata: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    issuedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

module.exports = Certificate;
