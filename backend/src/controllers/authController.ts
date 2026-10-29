import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { ApiError } from '../utils/ApiError';

export async function googleSignIn(req: Request, res: Response) {
  const credential = req.body.credential as string | undefined;
  if (!credential) {
    throw new ApiError('Google credential is required', 400, 'VALIDATION_ERROR');
  }

  const result = await authService.signInWithGoogle(credential);
  res.json({ success: true, data: result });
}

export async function getCurrentUser(req: Request, res: Response) {
  if (!req.user) {
    throw new ApiError('Not authenticated', 401, 'UNAUTHORIZED');
  }

  res.json({
    success: true,
    data: { user: authService.toAuthUser(req.user) },
  });
}
