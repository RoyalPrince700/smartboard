import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User, IUser } from '../models/User';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

const googleClient = new OAuth2Client(env.googleClientId);

export interface AuthUserPayload {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: 'user' | 'admin';
}

export interface AuthResult {
  token: string;
  user: AuthUserPayload;
}

function resolveRole(email: string, currentRole?: 'user' | 'admin'): 'user' | 'admin' {
  if (env.adminEmails.includes(email.toLowerCase())) return 'admin';
  return currentRole ?? 'user';
}

function toAuthUser(user: IUser): AuthUserPayload {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role,
  };
}

function signToken(user: IUser): string {
  return jwt.sign({ userId: user._id.toString() }, env.jwtSecret, {
    expiresIn: '7d',
  });
}

export class AuthService {
  async signInWithGoogle(credential: string): Promise<AuthResult> {
    if (!env.googleClientId) {
      throw new ApiError('Google sign-in is not configured', 503, 'AUTH_NOT_CONFIGURED');
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: env.googleClientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw new ApiError('Invalid Google credential', 401, 'INVALID_GOOGLE_CREDENTIAL');
    }

    if (!payload?.sub || !payload.email) {
      throw new ApiError('Google account is missing required profile data', 400, 'INVALID_GOOGLE_PROFILE');
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase();
    const name = payload.name?.trim() || email.split('@')[0];
    const avatarUrl = payload.picture ?? null;

    let user = await User.findOne({ googleId });

    const role = resolveRole(email);

    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        user.googleId = googleId;
        user.name = name;
        user.avatarUrl = avatarUrl;
        user.role = resolveRole(email, user.role);
        await user.save();
      } else {
        user = await User.create({
          googleId,
          email,
          name,
          avatarUrl,
          role,
        });
      }
    } else {
      user.name = name;
      user.avatarUrl = avatarUrl;
      user.role = resolveRole(email, user.role);
      await user.save();
    }

    return {
      token: signToken(user),
      user: toAuthUser(user),
    };
  }

  async getUserFromToken(token: string): Promise<IUser | null> {
    try {
      const decoded = jwt.verify(token, env.jwtSecret) as { userId?: string };
      if (!decoded.userId) return null;
      const user = await User.findById(decoded.userId);
      if (!user) return null;
      return this.syncRole(user);
    } catch {
      return null;
    }
  }

  async syncRole(user: IUser): Promise<IUser> {
    const role = resolveRole(user.email, user.role);
    if (user.role !== role) {
      user.role = role;
      await user.save();
    }
    return user;
  }

  toAuthUser(user: IUser): AuthUserPayload {
    return toAuthUser(user);
  }
}

export const authService = new AuthService();
