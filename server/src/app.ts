import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { errorHandler } from './middleware/error.middleware';
import passport from './lib/passport';
import authRoutes from './modules/auth/auth.routes';
import verificationRoutes from './modules/verification/verification.routes';
import documentsRoutes from './modules/documents/documents.routes';
import paymentsRoutes from './modules/payments/payments.routes';
import reportsRoutes from './modules/reports/reports.routes';
import adminRoutes from './modules/admin/admin.routes';
import usersRoutes from './modules/users/users.routes';
import walletRoutes from './modules/wallet/wallet.routes';
import purchasesRoutes from './modules/purchases/purchases.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
export { authLimiter } from './lib/rate-limiters';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:5173', credentials: true }));
// Capture raw body for webhook signature verification before JSON parser runs
app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'LandVerify API is running' });
});

app.use(passport.initialize());
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/verifications', verificationRoutes);
app.use('/api/v1/documents', documentsRoutes);
app.use('/api/v1/payments', paymentsRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/purchases', purchasesRoutes);
app.use('/api/v1/notifications', notificationsRoutes);

app.use(errorHandler);

export default app;
