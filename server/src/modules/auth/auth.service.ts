import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { createError } from '../../middleware/error.middleware';

export interface JwtPayload {
  sub: string;
  role: string;
}

function signToken(userId: string, role: string): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? '7d') as import('jsonwebtoken').SignOptions['expiresIn'];
  return jwt.sign(
    { sub: userId, role } as JwtPayload,
    process.env.JWT_SECRET!,
    { expiresIn }
  );
}

export async function registerUser(email: string, password: string) {
  if (password.length > 128) throw createError('Password too long', 400);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw createError('Email already registered', 409);

  const passwordHash = await argon2.hash(password);
  const user = await prisma.user.create({ data: { email, passwordHash } });
  const token = signToken(user.id, user.role);
  return { token, user: { id: user.id, email: user.email, role: user.role } };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) throw createError('Invalid credentials', 401);

  const valid = await argon2.verify(user.passwordHash, password);
  if (!valid) throw createError('Invalid credentials', 401);

  const token = signToken(user.id, user.role);
  return { token, user: { id: user.id, email: user.email, role: user.role } };
}

export function issueTokenForOAuthUser(userId: string, role: string): string {
  return signToken(userId, role);
}
