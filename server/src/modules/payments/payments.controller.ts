import { Request, Response, NextFunction } from 'express';
import * as paymentsService from './payments.service';

export async function initiatePayment(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as { id: string; email: string };
    const { verificationId, amount } = req.body;
    if (!verificationId || !amount) { res.status(400).json({ success: false, message: 'verificationId and amount are required' }); return; }
    const result = await paymentsService.initiatePayment({ verificationId, userId: user.id, amount: parseFloat(amount), customerEmail: user.email, callbackUrl: `${process.env.CLIENT_URL ?? 'http://localhost:5173'}/payment/callback` });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

export async function webhook(req: Request, res: Response, next: NextFunction) {
  try {
    const signature = req.headers['x-squad-encrypted-body'] as string;
    // req.body is a Buffer when express.raw() captures it before express.json() in app.ts
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString() : JSON.stringify(req.body);
    await paymentsService.handleWebhook(rawBody, signature);
    res.json({ success: true });
  } catch (err) { next(err); }
}

export async function getPaymentStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const payment = await paymentsService.getPaymentStatus(req.params.verificationId as string, (req.user as { id: string }).id);
    res.json({ success: true, payment });
  } catch (err) { next(err); }
}
