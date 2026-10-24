require('dotenv').config();
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}

const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically so recruiter can click and view resume
const phpUploadsDir = path.join(__dirname, '..', 'php-service', 'uploads');
app.use('/uploads', express.static(phpUploadsDir));

// API Routes
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Node + Express Core API',
    timestamp: new Date()
  });
});

// Root route
app.get('/', (req, res) => {
  res.send(`
    <h2>Mini Job Portal - Express Core Backend</h2>
    <p>Endpoints:</p>
    <ul>
      <li><a href="/api/jobs">GET /api/jobs</a></li>
      <li><a href="/api/applications">GET /api/applications</a></li>
      <li><a href="/api/health">GET /api/health</a></li>
    </ul>
  `);
});

// Start Server
app.listen(PORT, () => {
  console.log(`[*] Express Core Server running on http://127.0.0.1:${PORT}`);
});
