const createError = require('http-errors');
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');

require('dotenv').config();

const requiredEnv = ['MONGO_URI', 'JWT_SECRET', 'ADMIN_KEY'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.error(`Missing required environment variables: ${missingEnv.join(', ')}`);
  console.error('Copy powerflow-backend/.env.example to .env and fill in the values.');
  process.exit(1);
}

//Route imports
const authRoutes = require('./routes/user/auth');
const meterRoutes = require('./routes/user/meter');
//admin routes imports
const adminDashboardRoutes = require("./routes/admin/dashboard");
const adminVerificationsRoutes = require('./routes/admin/verification');
const adminUserRoutes = require('./routes/admin/users');
const analyticsRoutes = require('./routes/admin/analytics');
const platformConfigRoutes = require('./routes/admin/platformConfig');
const adminSystemConfigRoutes = require('./routes/admin/systemConfig');



//Initializing app and database
connectDB();
const app = express();

const { startMeterSimulation } = require('./services/meterSimulator');

// Start background meter simulation
startMeterSimulation();

//stripe will be here.

//general middleware
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.options('*', cors());

// IMPORTANT: Register Stripe routes BEFORE express.json so webhook has raw body
app.use('/api/stripe', require('./routes/user/stripe'));
app.use('/api/payments', require('./routes/user/payments'));

// Body parsers for the rest of the routes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static serving for uploaded assets (e.g., KYC)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

//API routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', require('./routes/user/wallet'));
app.use('/api/energy', require('./routes/user/energy'));
app.use('/api/dashboard', require('./routes/user/dashboard'));
app.use('/api/profile', require('./routes/user/profile')); 
app.use('/api/help', require('./routes/user/help'));
app.use('/api/meters', meterRoutes);
app.use('/api/test/meter', require('./routes/user/meter'));

//admin api routes
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use('/api/admin/verifications', adminVerificationsRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/transactions', require('./routes/admin/transactions'));
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/admin/config', platformConfigRoutes);
app.use('/api/admin/system-config', adminSystemConfigRoutes);
app.use('/api/admin/profile', require('./routes/admin/profile'));






//Root route
app.get('/', (req, res) => {
  res.send('PowerFlow Backend API running');
});

//global error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500; //500 = internal server error

  console.error(`Status: ${statusCode}, Message: ${err.message}`);
  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unknown server error occurred',
    errorDetails: process.env.NODE_ENV === 'development' ? err : {},
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});