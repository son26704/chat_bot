import { Request } from 'express';
import { IncomingHttpHeaders } from 'http';

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UserPayload {
  id: string;
}

interface CustomHeaders extends IncomingHttpHeaders {
  authorization?: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: UserPayload;
    headers: CustomHeaders;
  }
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
  headers: CustomHeaders;
}