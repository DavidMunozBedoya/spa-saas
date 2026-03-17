import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config/db.js', () => ({
    default: {
        query: vi.fn(),
        connect: vi.fn(),
        end: vi.fn(),
    }
}));

import pool from '../../config/db.js';
import { ReportsService } from './reports.service.js';

describe('ReportsService', () => {
    let reportsService: ReportsService;
    const mockPool = pool as any;

    beforeEach(() => {
        reportsService = new ReportsService();
        vi.clearAllMocks();
    });

    describe('getDashboardStats', () => {
        it('debería calcular estadísticas correctamente', async () => {
            mockPool.query
                .mockResolvedValueOnce({ rows: [{ count: '10' }] }) // appointmentsCount
                .mockResolvedValueOnce({ rows: [{ total_revenue: '500.50' }] }) // revenueRes
                .mockResolvedValueOnce({ rows: [{ count: '5' }] }); // newClientsCount

            const result = await reportsService.getDashboardStats('spa-uuid', '2026-01-01', '2026-01-31');

            expect(result.totalAppointments).toBe(10);
            expect(result.totalRevenue).toBe(500.50);
            expect(result.newClients).toBe(5);
        });

        it('debería manejar ingresos nulos retornando 0', async () => {
            mockPool.query
                .mockResolvedValueOnce({ rows: [{ count: '0' }] })
                .mockResolvedValueOnce({ rows: [{ total_revenue: null }] })
                .mockResolvedValueOnce({ rows: [{ count: '0' }] });

            const result = await reportsService.getDashboardStats('spa-uuid', '2026-01-01', '2026-01-31');

            expect(result.totalRevenue).toBe(0);
        });
    });

    describe('getStaffPerformance', () => {
        it('debería retornar el ranking de staff', async () => {
            mockPool.query.mockResolvedValueOnce({
                rows: [
                    { full_name: 'Staff A', total_appointments: '5', completed_appointments: '4' },
                    { full_name: 'Staff B', total_appointments: '3', completed_appointments: '3' }
                ]
            });

            const result = await reportsService.getStaffPerformance('spa-uuid', '2026-01-01', '2026-01-31');

            expect(result).toHaveLength(2);
            expect(result[0].name).toBe('Staff A');
            expect(result[0].total).toBe(5);
        });
    });
});
