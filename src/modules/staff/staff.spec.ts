import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config/db.js', () => ({
    default: {
        query: vi.fn(),
        connect: vi.fn(),
        end: vi.fn(),
    }
}));

import pool from '../../config/db.js';
import { StaffService } from './staff.service.js';

describe('StaffService', () => {
    let staffService: StaffService;
    const mockPool = pool as any;

    beforeEach(() => {
        staffService = new StaffService();
        vi.clearAllMocks();
    });

    describe('createStaff', () => {
        it('debería crear un miembro del staff exitosamente', async () => {
            const staffData = {
                spa_id: 'spa-uuid',
                full_name: 'John Staff',
                email: 'john@example.com',
                phone: '123'
            };

            // 1. Check Spa
            mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'spa-uuid' }] });
            // 2. Insert Staff
            mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'staff-uuid', ...staffData }] });

            const result = await staffService.createStaff(staffData);

            expect(result.id).toBe('staff-uuid');
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT id FROM spas'),
                ['spa-uuid']
            );
        });

        it('debería fallar si el Spa no existe', async () => {
            mockPool.query.mockResolvedValueOnce({ rows: [] });

            await expect(staffService.createStaff({
                spa_id: 'invalid',
                full_name: 'Any',
                email: 'any@any.com'
            })).rejects.toThrow('El Spa especificado no existe');
        });
    });

    describe('getBySpa', () => {
        it('debería retornar el staff activo del Spa', async () => {
            mockPool.query.mockResolvedValueOnce({ rows: [{ id: '1', full_name: 'Staff 1' }] });
            const result = await staffService.getBySpa('spa-uuid');
            expect(result).toHaveLength(1);
        });
    });
});
