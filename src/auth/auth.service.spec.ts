import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import { UserService } from '../user/user.service.js';
import { hashPassword } from '../user/password.js';

describe('AuthService', () => {
  let service: AuthService;
  const userService = { findByEmailWithPassword: vi.fn(), findOne: vi.fn() };
  const jwtService = { sign: vi.fn() };

  beforeEach(async () => {
    vi.resetAllMocks(); // no leftovers from the previous test
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  const storedAnn = async () => ({
    id: 1,
    email: 'ann@example.com',
    password: await hashPassword('secret123'), // a real hash, so verify runs for real
  });

  it('returns null for an unknown email', async () => {
    userService.findByEmailWithPassword.mockResolvedValue(null);
    await expect(service.validateUser('nobody@example.com', 'secret123')).resolves.toBeNull();
  });

  it('returns null for a wrong password', async () => {
    userService.findByEmailWithPassword.mockResolvedValue(await storedAnn());
    await expect(service.validateUser('ann@example.com', 'nope-nope')).resolves.toBeNull();
  });

  it('returns the user without the hash for the right password', async () => {
    userService.findByEmailWithPassword.mockResolvedValue(await storedAnn());
    // toEqual fails on extra keys, so this also proves the hash isn't returned
    await expect(service.validateUser('ann@example.com', 'secret123')).resolves.toEqual({
      id: 1,
      email: 'ann@example.com',
    });
  });

  it('signs a token with sub and email', () => {
    jwtService.sign.mockReturnValue('signed-token');
    expect(service.login({ id: 1, email: 'ann@example.com' })).toEqual({ access_token: 'signed-token' });
    expect(jwtService.sign).toHaveBeenCalledWith({ sub: 1, email: 'ann@example.com' });
  });
});
