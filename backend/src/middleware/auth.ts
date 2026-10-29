import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { ApiError } from '../utils/ApiError';

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) {
    next();
    return;
  }

  const user = await authService.getUserFromToken(token);
  if (user) {
    req.user = user;
  }
  next();
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) {
    next(new ApiError('Authentication required', 401, 'UNAUTHORIZED'));
    return;
  }

  const user = await authService.getUserFromToken(token);
  if (!user) {
    next(new ApiError('Invalid or expired session', 401, 'UNAUTHORIZED'));
    return;
  }

  req.user = user;
  next();
}

export async function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) {
    next(new ApiError('Authentication required', 401, 'UNAUTHORIZED'));
    return;
  }

  const user = await authService.getUserFromToken(token);
  if (!user) {
    next(new ApiError('Invalid or expired session', 401, 'UNAUTHORIZED'));
    return;
  }

  if (user.role !== 'admin') {
    next(new ApiError('Admin access required', 403, 'FORBIDDEN'));
    return;
  }

  req.user = user;
  next();
}
