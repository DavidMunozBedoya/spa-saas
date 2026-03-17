import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config/db.js', () => ({
    default: {
        query: vi.fn(),
        connect: vi.fn(),
        end: vi.fn(),
    }
}));

import pool from '../../config/db.js';
import { SpaService } from './spa.service.js';

describe('SpaService', () => {
    let spaService: SpaService;
    const mockPool = pool as any;

    beforeEach(() => {
        spaService = new SpaService();
        vi.clearAllMocks();
    });

    describe('createSpa', () => {
        it('debería crear un Spa exitosamente', async () => {
            const spaData = {
                name: 'New Spa',
                email: 'spa@example.com',
                phone: '123456789',
                timezone: 'America/Bogota'
            };

            mockPool.query.mockResolvedValueOnce({
                rows: [{ id: 'spa-uuid', ...spaData, active: true }]
            });

            const result = await spaService.createSpa(spaData);

            expect(result.name).toBe('New Spa');
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO spas'),
                expect.arrayContaining(['New Spa'])
            );
        });
    });

    describe('getAllSpas', () => {
        it('debería retornar todos los Spas activos', async () => {
            mockPool.query.mockResolvedValueOnce({
                rows: [{ id: '1', name: 'Spa 1' }, { id: '2', name: 'Spa 2' }]
            });

            const result = await spaService.getAllSpas();

            expect(result).toHaveLength(2);
            expect(result[0].name).toBe('Spa 1');
        });
    });

    describe('updateSpa', () => {
        it('debería actualizar campos dinámicamente', async () => {
            const updateData = { name: 'Updated Name', phone: '987' };

            mockPool.query.mockResolvedValueOnce({
                rows: [{ id: 'spa-uuid', ...updateData, active: true }]
            });

            const result = await spaService.updateSpa('spa-uuid', updateData);

            expect(result.name).toBe('Updated Name');
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE spas SET name = $2, phone = $3'),
                ['spa-uuid', 'Updated Name', '987']
            );
        });
    });

    describe('softDeleteSpa', () => {
        it('debería desactivar el Spa', async () => {
            mockPool.query.mockResolvedValueOnce({
                rows: [{ id: 'spa-uuid', active: false }]
            });

            const result = await spaService.softDeleteSpa('spa-uuid');

            expect(result.active).toBe(false);
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE spas SET active = false'),
                ['spa-uuid']
            );
        });
    });
});
