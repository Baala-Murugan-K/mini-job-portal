require('dotenv').config();
const dns = require('dns');
const mongoose = require('mongoose');

// Fix for Node.js / Windows ISP DNS blocking MongoDB Atlas SRV records (ECONNREFUSED querySrv)
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // Ignore if custom DNS cannot be set
}

let isMongoConnected = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mini_job_portal';

  try {
    console.log('[*] Connecting to MongoDB...');
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 7000
    });
    isMongoConnected = true;
    console.log('[*] MongoDB connected successfully to MongoDB Atlas / Database!');
  } catch (err) {
    isMongoConnected = false;
    console.warn('[!] MongoDB connection failed:', err.message);
    console.warn('[i] Using built-in In-Memory fallback store so server runs seamlessly!');
  }
};

const getIsConnected = () => isMongoConnected;

module.exports = { connectDB, getIsConnected };
