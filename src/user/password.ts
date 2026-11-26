import { hash, verify } from '@node-rs/argon2';

const OPTIONS = { memoryCost: 19456, timeCost: 4, parallelism: 2 }

export function hashPassword(plain: string) {
    return hash(plain, OPTIONS)
}

export async function verifyPassword(stored: string, plain: string) {
    try {
        return await verify(stored, plain)
    } catch {
        return false;
    }
}