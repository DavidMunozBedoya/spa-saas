import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config/db.js', () => ({
    default: {
        query: vi.fn(),
        connect: vi.fn(),
        end: vi.fn(),
    }
}));

import pool from '../../config/db.js';
import { ServiceService } from './service.service.js';

describe('ServiceService', () => {
    let serviceService: ServiceService;
    const mockPool = pool as any;

    beforeEach(() => {
        serviceService = new ServiceService();
        vi.clearAllMocks();
    });

    describe('createService', () => {
        it('debería crear un servicio exitosamente', async () => {
            const serviceData = {
                spa_id: 'spa-uuid',
                name: 'Massaje',
                description: 'Relaxing massage',
                duration_minutes: 60,
                price: 50
            };

            mockPool.query.mockResolvedValueOnce({
                rows: [{ id: 'service-uuid', ...serviceData, active: true }]
            });

            const result = await serviceService.createService(serviceData);

            expect(result.name).toBe('Massaje');
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO services'),
                expect.arrayContaining(['Massaje'])
            );
        });
    });

    describe('getBySpa', () => {
        it('debería retornar servicios activos de un Spa', async () => {
            mockPool.query.mockResolvedValueOnce({
                rows: [{ id: '1', name: 'Service A' }, { id: '2', name: 'Service B' }]
            });

            const result = await serviceService.getBySpa('spa-uuid');

            expect(result).toHaveLength(2);
            expect(result[0].name).toBe('Service A');
        });
    });

    describe('updateService', () => {
        it('debería actualizar campos de forma dinámica', async () => {
            const updateData = { name: 'Deep Massage', price: 70 };

            mockPool.query.mockResolvedValueOnce({
                rows: [{ id: 'service-uuid', ...updateData, active: true }]
            });

            const result = await serviceService.updateService('service-uuid', 'spa-uuid', updateData);

            expect(result.price).toBe(70);
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE services SET name = $3, price = $4'),
                ['service-uuid', 'spa-uuid', 'Deep Massage', 70]
            );
        });
    });
});
