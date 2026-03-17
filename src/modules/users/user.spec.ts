import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config/db.js', () => ({
    default: {
        query: vi.fn(),
        connect: vi.fn(),
        end: vi.fn(),
    }
}));

import pool from '../../config/db.js';
import { UserService } from './user.service.js';

describe('UserService', () => {
    let userService: UserService;
    const mockPool = pool as any;
    const mockClient = {
        query: vi.fn(),
        release: vi.fn(),
    };

    beforeEach(() => {
        userService = new UserService();
        vi.clearAllMocks();
        mockPool.connect.mockResolvedValue(mockClient);
    });

    describe('createUser', () => {
        it('debería crear un usuario con múltiples roles dentro de una transacción', async () => {
            const userData = {
                spa_id: 'spa-uuid',
                role_ids: [1, 2],
                full_name: 'New User',
                email: 'new@example.com',
                password: 'password123'
            };

            // Mocks de las queries en orden
            mockClient.query
                .mockResolvedValueOnce({}) // BEGIN
                .mockResolvedValueOnce({ rows: [{ id: 'spa-uuid' }] }) // Check Spa
                .mockResolvedValueOnce({ // Insert User
                    rows: [{
                        id: 'user-uuid',
                        spa_id: 'spa-uuid',
                        full_name: 'New User',
                        email: 'new@example.com',
                        active: true,
                        created_at: new Date()
                    }]
                })
                .mockResolvedValueOnce({}) // Insert Role 1
                .mockResolvedValueOnce({}) // Insert Role 2
                .mockResolvedValueOnce({}); // COMMIT

            const result = await userService.createUser(userData);

            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
            expect(result.role_ids).toEqual([1, 2]);
            expect(result.id).toBe('user-uuid');
        });

        it('debería hacer ROLLBACK si ocurre un error', async () => {
            mockClient.query
                .mockResolvedValueOnce({}) // BEGIN
                .mockRejectedValueOnce(new Error('DB Error')); // Check Spa fails

            await expect(userService.createUser({
                spa_id: 'any',
                role_ids: [1],
                full_name: 'Any',
                email: 'any@any.com',
                password: 'any'
            })).rejects.toThrow('DB Error');

            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
            expect(mockClient.release).toHaveBeenCalled();
        });
    });

    describe('getById', () => {
        it('debería retornar un usuario con sus roles como array', async () => {
            mockPool.query.mockResolvedValueOnce({
                rows: [{
                    id: 'user-uuid',
                    role_ids: [1, 2],
                    full_name: 'Test User'
                }]
            });

            const result = await userService.getById('user-uuid');

            expect(result.role_ids).toEqual([1, 2]);
        });
    });

    describe('updateUser', () => {
        it('debería sincronizar roles correctamente', async () => {
            mockClient.query
                .mockResolvedValueOnce({}) // BEGIN
                .mockResolvedValueOnce({}) // DELETE user_roles
                .mockResolvedValueOnce({}) // INSERT Role 1
                .mockResolvedValueOnce({}) // COMMIT

            // Mock getById que se llama al final
            mockPool.query.mockResolvedValueOnce({
                rows: [{ id: 'user-uuid', role_ids: [1] }]
            });

            const result = await userService.updateUser('user-uuid', { role_ids: [1] });

            expect(mockClient.query).toHaveBeenCalledWith('DELETE FROM user_roles WHERE user_id = $1', ['user-uuid']);
            expect(result.role_ids).toEqual([1]);
        });
    });
});
