const sequelize = require('../config/database');
const User = require('./User');
const Student = require('./Student');
const Certificate = require('./Certificate');
const Session = require('./Session');

// Relationships could be defined here if needed
// e.g., Student.hasMany(Certificate, { foreignKey: 'studentId', sourceKey: 'studentId' });

const initDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL connection has been established successfully.');

        // Sync models (alter: true updates tables without dropping them)
        await sequelize.sync({ alter: true });
        console.log('Database synced successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

module.exports = {
    sequelize,
    initDB,
    User,
    Student,
    Certificate,
    Session
};
