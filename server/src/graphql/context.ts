import jwt from 'jsonwebtoken';
import type { Request } from 'express';
import { prisma } from '../lib/prisma';

interface JwtPayload {
  sub: string;
  role: string;
}

export interface GraphQLContext {
  user: { id: string; email: string; role: string } | undefined;
}

export async function buildContext({
  req,
  connectionParams,
}: {
  req?: Request;
  connectionParams?: Record<string, unknown>;
}): Promise<GraphQLContext> {
  let token: string | undefined;

  // Extract token from HTTP header or WebSocket connectionParams
  if (req) {
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      token = auth.slice(7);
    }
  } else if (connectionParams) {
    const auth = connectionParams.authorization;
    if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
      token = auth.slice(7);
    }
  }

  if (!token) {
    return { user: undefined };
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return { user: undefined };
    }
    return { user: { id: user.id, email: user.email, role: user.role } };
  } catch {
    return { user: undefined };
  }
}
