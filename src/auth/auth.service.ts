import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { verifyPassword } from '../user/password.js';
import { UserService } from '../user/user.service.js';
import type { AuthUser, JwtPayload } from './auth.types.js';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
    ) {}

    async validateUser(email: string, password: string): Promise<AuthUser | null> {
        const user = await this.userService.findByEmailWithPassword(email);
        if (!user) return null;

        const matches = await verifyPassword(user.password, password);
        if (!matches) return null;

        return { id: user.id, email: user.email }
    }

    login(user: AuthUser) {
        const payload: JwtPayload = { sub: user.id, email: user.email }
        return { access_token: this.jwtService.sign(payload) }
    }

    profile(user: AuthUser) {
        return this.userService.findOne(user.id);
    }
}
