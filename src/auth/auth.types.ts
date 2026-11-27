import type { Request } from 'express';

export type JwtPayload = { sub: number, email: string }

export type AuthUser = { id: number, email: string }

export type AuthRequest = Request & { user: AuthUser }