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
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface UserPayload {
  id: string;
}

interface CustomHeaders extends IncomingHttpHeaders {
  authorization?: string;
}

export interface AuthenticatedRequest extends Request {
  headers: CustomHeaders;
  user?: UserPayload;
}