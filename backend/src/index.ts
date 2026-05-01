import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import connectDB from './config/db';
import apiRoutes from './routes/api';

dotenv.config();

const app = express();
const PORT = process.env.PORT;
if (!PORT) {
  throw new Error('⚠️ PORT not found in environment variables.');
}

// Connect to Database
connectDB();

// Middleware
app.use(morgan('dev')); // HTTP request logging

// Robust CORS Middleware for Safari/Local Development
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json({ limit: '10mb' })); // Support base64 images

// Routes
app.use('/api', apiRoutes);

// Basic Route
app.get('/', (req, res) => {
  res.send('VMS API is running...');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
