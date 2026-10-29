import { Request, Response } from 'express';
import { adminService } from '../services/adminService';

export async function getAdminStats(_req: Request, res: Response) {
  const stats = await adminService.getStats();
  res.json({ success: true, data: stats });
}

export async function listUsers(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const result = await adminService.listUsers(page, limit);
  res.json({ success: true, data: result });
}
