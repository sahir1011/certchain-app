const { Sequelize } = require('sequelize');
require('dotenv').config();

// Explicitly require pg to ensure Vercel's bundler includes it
const pg = require('pg');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectModule: pg,
    logging: false, // Set to console.log to see SQL queries
    dialectOptions: {
        ssl: process.env.DB_SSL === 'true' ? {
            require: true,
            rejectUnauthorized: false
        } : false
    }
});

module.exports = sequelize;
