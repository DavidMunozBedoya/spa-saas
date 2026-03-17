import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config/db.js', () => ({
    default: {
        query: vi.fn(),
        connect: vi.fn(),
        end: vi.fn(),
    }
}));

import pool from '../../config/db.js';
import { ClientService } from './client.service.js';

describe('ClientService', () => {
    let clientService: ClientService;
    const mockPool = pool as any;

    beforeEach(() => {
        clientService = new ClientService();
        vi.clearAllMocks();
    });

    describe('createClient', () => {
        it('debería crear un cliente exitosamente si el email no está en uso en ese Spa', async () => {
            const clientData = {
                spa_id: 'spa-uuid',
                full_name: 'Client Name',
                email: 'client@example.com',
                phone: '123'
            };

            // 1. Check email uniqueness
            mockPool.query.mockResolvedValueOnce({ rows: [] });
            // 2. Insert Client
            mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'client-uuid', ...clientData }] });

            const result = await clientService.createClient(clientData);

            expect(result.id).toBe('client-uuid');
            expect(mockPool.query).toHaveBeenCalledTimes(2);
        });

        it('debería fallar si el email ya existe en el Spa', async () => {
            mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'existing-id' }] });

            await expect(clientService.createClient({
                spa_id: 'spa-uuid',
                full_name: 'Any',
                email: 'duplicate@example.com'
            })).rejects.toThrow('Este email ya está registrado para un cliente en este Spa');
        });
    });

    describe('getBySpa', () => {
        it('debería retornar los clientes del Spa', async () => {
            mockPool.query.mockResolvedValueOnce({ rows: [{ id: '1', full_name: 'Client A' }] });
            const result = await clientService.getBySpa('spa-uuid');
            expect(result).toHaveLength(1);
        });
    });
});
