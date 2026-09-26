import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { securityHeaders, globalErrorHandler } from './middleware/security.js';

import authRoutes from './routes/auth.routes.js';
import companyRoutes from './routes/company.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import permissionRoutes from './routes/permission.routes.js';
import taskRoutes from './routes/task.routes.js';
import updateRoutes from './routes/update.routes.js';
import messageRoutes from './routes/message.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

dotenv.config();

const app = express();

// CORS setup
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow dev origins
      }
    },
    credentials: true,
  })
);

// Security Headers & Body Parser
app.use(securityHeaders);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/updates', updateRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Global Error Handler
app.use(globalErrorHandler);

export default app;
