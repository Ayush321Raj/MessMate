require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

// Route imports
const authRoutes = require('./routes/auth');
const mealRoutes = require('./routes/meals');
const passRoutes = require('./routes/passes');
const inventoryRoutes = require('./routes/inventory');
const billingRoutes = require('./routes/billing');
const feedbackRoutes = require('./routes/feedback');
const analyticsRoutes = require('./routes/analytics');
const forecastRoutes = require('./routes/forecast');
const adminRoutes = require('./routes/admin');
const assistantRoutes = require('./routes/assistant');
const wasteRoutes = require('./routes/waste');
const announcementRoutes = require('./routes/announcements');

const { socketAuth } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Attach io to app so routes can access it
app.set('io', io);

// Socket.io connection
io.use(socketAuth);
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id} (user: ${socket.userId})`);
  if (socket.userRole === 'student') socket.join(`student:${socket.userId}`);

  socket.on('join:kitchen', (mealId) => {
    socket.join(`kitchen:${mealId}`);
  });

  socket.on('join:admin', () => {
    socket.join('admin:dashboard');
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/passes', passRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/waste', wasteRoutes);
app.use('/api/announcements', announcementRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'messmate-api' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// MongoDB + Server start
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, () => console.log(`🚀 MessMate API running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = { app, io };
