import { Request, Response } from 'express';
import { boardService } from '../services/boardService';

export async function createBoard(req: Request, res: Response) {
  const board = await boardService.create(req.body, req.user?._id.toString());
  res.status(201).json({ success: true, data: board });
}

export async function getBoards(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await boardService.findAll(page, limit, req.user?._id.toString());
  res.json({ success: true, data: result });
}

export async function getBoard(req: Request, res: Response) {
  const board = await boardService.findById(req.params.id, req.user?._id.toString());
  res.json({ success: true, data: board });
}

export async function updateBoard(req: Request, res: Response) {
  const board = await boardService.update(req.params.id, req.body, req.user?._id.toString());
  res.json({ success: true, data: board });
}

export async function deleteBoard(req: Request, res: Response) {
  await boardService.delete(req.params.id, req.user?._id.toString());
  res.status(204).send();
}
