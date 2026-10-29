import { Request, Response } from 'express';
import { getDbStatus } from '../config/db';

export function healthCheck(_req: Request, res: Response) {
  const db = getDbStatus();
  const healthy = db === 'connected';

  res.status(healthy ? 200 : 503).json({
    success: healthy,
    data: {
      status: healthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      db,
    },
  });
}
