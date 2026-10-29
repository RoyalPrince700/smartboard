import { User } from '../models/User';

export class AdminService {
  async listUsers(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('email name avatarUrl role createdAt updatedAt')
        .lean(),
      User.countDocuments(),
    ]);

    return {
      users: users.map((user) => ({
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      total,
      page,
      limit,
    };
  }

  async getStats() {
    const [totalUsers, adminCount] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
    ]);

    return { totalUsers, adminCount };
  }
}

export const adminService = new AdminService();
