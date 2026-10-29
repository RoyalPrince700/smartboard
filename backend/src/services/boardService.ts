import { Types } from 'mongoose';
import { Board } from '../models/Board';
import { CreateBoardInput, UpdateBoardInput } from '../types/board';
import { DEFAULT_CANVAS_SETTINGS } from '../types/stroke';
import { ApiError } from '../utils/ApiError';

function assertBoardAccess(board: { owner: Types.ObjectId | null }, userId?: string) {
  if (!board.owner) return;
  if (!userId || board.owner.toString() !== userId) {
    throw new ApiError('You do not have access to this board', 403, 'FORBIDDEN');
  }
}

export class BoardService {
  async create(input: CreateBoardInput = {}, userId?: string) {
    const board = await Board.create({
      title: input.title ?? 'Untitled Board',
      owner: userId ? new Types.ObjectId(userId) : null,
      strokes: input.strokes ?? [],
      canvasSettings: {
        ...DEFAULT_CANVAS_SETTINGS,
        ...input.canvasSettings,
      },
    });
    return board;
  }

  async findAll(page = 1, limit = 20, userId?: string): Promise<{
    boards: Array<{
      _id: unknown;
      title: string;
      strokeCount: number;
      createdAt: Date;
      updatedAt: Date;
    }>;
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const filter = userId
      ? { owner: new Types.ObjectId(userId) }
      : { owner: null };

    const [boards, total] = await Promise.all([
      Board.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('title createdAt updatedAt strokes')
        .lean(),
      Board.countDocuments(filter),
    ]);

    return {
      boards: boards.map((b) => ({
        ...b,
        strokeCount: b.strokes?.length ?? 0,
        strokes: undefined,
      })),
      total,
      page,
      limit,
    };
  }

  async findById(id: string, userId?: string) {
    const board = await Board.findById(id);
    if (!board) {
      throw new ApiError('Board not found', 404, 'BOARD_NOT_FOUND');
    }
    assertBoardAccess(board, userId);
    return board;
  }

  async update(id: string, input: UpdateBoardInput, userId?: string) {
    const board = await Board.findById(id);
    if (!board) {
      throw new ApiError('Board not found', 404, 'BOARD_NOT_FOUND');
    }
    assertBoardAccess(board, userId);

    if (input.title !== undefined) board.title = input.title;
    if (input.strokes !== undefined) board.strokes = input.strokes;
    if (input.canvasSettings !== undefined) {
      board.canvasSettings = {
        ...board.canvasSettings,
        ...input.canvasSettings,
      };
    }
    if (input.aiHistory !== undefined) board.aiHistory = input.aiHistory;
    if (input.recognizedText !== undefined) board.recognizedText = input.recognizedText;
    if (input.lessonMeta !== undefined) {
      board.lessonMeta = { ...board.lessonMeta, ...input.lessonMeta };
    }

    await board.save();
    return board;
  }

  async appendAIHistory(
    id: string,
    entry: Omit<import('../types/board').AIHistoryEntry, 'createdAt'> & { createdAt?: Date },
    userId?: string
  ) {
    const board = await Board.findById(id);
    if (!board) {
      throw new ApiError('Board not found', 404, 'BOARD_NOT_FOUND');
    }
    assertBoardAccess(board, userId);

    board.aiHistory.push({
      ...entry,
      createdAt: entry.createdAt ?? new Date(),
    });

    if (entry.inputType === 'handwriting' && entry.rawInput) {
      board.recognizedText = entry.rawInput;
    }

    await board.save();
    return board;
  }

  async delete(id: string, userId?: string) {
    const board = await Board.findById(id);
    if (!board) {
      throw new ApiError('Board not found', 404, 'BOARD_NOT_FOUND');
    }
    assertBoardAccess(board, userId);
    await board.deleteOne();
    return board;
  }
}

export const boardService = new BoardService();
