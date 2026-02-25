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

        // Prevent Vercel from trying to alter tables concurrently on every cold start
        if (process.env.VERCEL !== '1') {
            await sequelize.sync({ alter: true });
            console.log('Database synced successfully.');
        } else {
            console.log('Vercel environment detected – skipping schema sync.');
        }
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        throw error;
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
