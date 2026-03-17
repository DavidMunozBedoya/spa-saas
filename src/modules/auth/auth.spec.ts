import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hashPassword } from '../../utils/security.js';

vi.mock('../../config/db.js', () => ({
    default: {
        query: vi.fn(),
        connect: vi.fn(),
        end: vi.fn(),
    }
}));

import pool from '../../config/db.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
    let authService: AuthService;
    const mockPool = pool as any;

    beforeEach(() => {
        authService = new AuthService();
        vi.clearAllMocks();
    });

    describe('login', () => {
        it('debería hacer login exitoso si las credenciales son válidas', async () => {
            const password = 'password123';
            const hashedPassword = await hashPassword(password);

            mockPool.query.mockResolvedValueOnce({
                rows: [{
                    id: 'user-uuid',
                    spa_id: 'spa-uuid',
                    full_name: 'Test User',
                    password_hash: hashedPassword,
                    active: true,
                    role_ids: [1, 2]
                }]
            });

            const result = await authService.login({
                email: 'test@example.com',
                password: password
            });

            expect(result).toHaveProperty('token');
            expect(result.user.email).toBe('test@example.com');
            expect(result.user.role_ids).toEqual([1, 2]);
        });

        it('debería fallar si el usuario no existe', async () => {
            mockPool.query.mockResolvedValueOnce({ rows: [] });

            await expect(authService.login({
                email: 'wrong@example.com',
                password: 'any'
            })).rejects.toThrow('Credenciales inválidas o cuenta desactivada');
        });

        it('debería fallar si la contraseña es incorrecta', async () => {
            const hashedPassword = await hashPassword('real-password');

            mockPool.query.mockResolvedValueOnce({
                rows: [{
                    password_hash: hashedPassword,
                    active: true
                }]
            });

            await expect(authService.login({
                email: 'test@example.com',
                password: 'wrong-password'
            })).rejects.toThrow('Credenciales inválidas');
        });
    });

    describe('platformLogin', () => {
        it('debería hacer login de plataforma exitoso', async () => {
            const password = 'admin-password';
            const hashedPassword = await hashPassword(password);

            mockPool.query.mockResolvedValueOnce({
                rows: [{
                    id: 'admin-uuid',
                    email: 'admin@platform.com',
                    password_hash: hashedPassword,
                    role: 'SUPER_ADMIN',
                    active: true
                }]
            });

            const result = await authService.platformLogin({
                email: 'admin@platform.com',
                password: password
            });

            expect(result).toHaveProperty('token');
            expect(result.user.role).toBe('SUPER_ADMIN');
        });
    });
});
