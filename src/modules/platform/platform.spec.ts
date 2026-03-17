import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config/db.js', () => ({
    default: {
        query: vi.fn(),
        connect: vi.fn(),
        end: vi.fn(),
    }
}));

import pool from '../../config/db.js';
import { PlatformService } from './platform.service.js';

describe('PlatformService', () => {
    let platformService: PlatformService;
    const mockPool = pool as any;

    beforeEach(() => {
        platformService = new PlatformService();
        vi.clearAllMocks();
    });

    describe('getAllSpas', () => {
        it('debería retornar todos los Spas del sistema', async () => {
            mockPool.query.mockResolvedValueOnce({
                rows: [{ id: '1', name: 'Spa 1', active: true }, { id: '2', name: 'Spa 2', active: false }]
            });

            const result = await platformService.getAllSpas();

            expect(result).toHaveLength(2);
            expect(result[1].active).toBe(false);
        });
    });

    describe('updateSpaStatus', () => {
        it('debería actualizar el estado de un Spa', async () => {
            mockPool.query.mockResolvedValueOnce({
                rows: [{ id: 'spa-uuid', active: false }]
            });

            const result = await platformService.updateSpaStatus('spa-uuid', false);

            expect(result.active).toBe(false);
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE spas SET active = $2'),
                ['spa-uuid', false]
            );
        });
    });

    describe('getGlobalStats', () => {
        it('debería agregar estadísticas globales', async () => {
            mockPool.query
                .mockResolvedValueOnce({ rows: [{ count: '5' }] }) // spasCount
                .mockResolvedValueOnce({ rows: [{ count: '20' }] }) // usersCount
                .mockResolvedValueOnce({ rows: [{ count: '100' }] }); // appointmentsCount

            const result = await platformService.getGlobalStats();

            expect(result.totalSpas).toBe(5);
            expect(result.totalUsers).toBe(20);
            expect(result.totalAppointments).toBe(100);
        });
    });
});
