import { Request, Response } from 'express';
import { getDbStatus } from '../config/db';

export function healthCheck(_req: Request, res: Response) {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: getDbStatus(),
    },
  });
}
