import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config/db.js', () => ({
    default: {
        query: vi.fn(),
        connect: vi.fn(),
        end: vi.fn(),
    }
}));

import pool from '../../config/db.js';
import { AppointmentService } from './appointment.service.js';

describe('AppointmentService', () => {
    let appointmentService: AppointmentService;
    const mockPool = pool as any;
    const mockClient = {
        query: vi.fn(),
        release: vi.fn(),
    };

    beforeEach(() => {
        appointmentService = new AppointmentService();
        vi.clearAllMocks();
        mockPool.connect.mockResolvedValue(mockClient);
    });

    describe('createAppointment', () => {
        const appointmentData = {
            spa_id: 'spa-uuid',
            client_id: 'client-uuid',
            staff_id: 'staff-uuid',
            service_ids: ['service-uuid'],
            start_time: '2026-03-01T10:00:00Z',
            end_time: '2026-03-01T11:00:00Z'
        };

        it('debería crear una cita si no hay solapamientos', async () => {
            mockClient.query
                .mockResolvedValueOnce({}) // BEGIN
                .mockResolvedValueOnce({ rows: [] }) // Overlap check (empty)
                .mockResolvedValueOnce({ rows: [{ id: 'apt-uuid', ...appointmentData }] }) // Insert Apt
                .mockResolvedValueOnce({}) // Insert service
                .mockResolvedValueOnce({}); // COMMIT

            const result = await appointmentService.createAppointment(appointmentData);

            expect(result.id).toBe('apt-uuid');
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
        });

        it('debería fallar si hay solapamiento de horario', async () => {
            mockClient.query
                .mockResolvedValueOnce({}) // BEGIN
                .mockResolvedValueOnce({ rows: [{ id: 'other-apt' }] }); // Overlap found

            await expect(appointmentService.createAppointment(appointmentData))
                .rejects.toThrow('ALERTA: El profesional ya tiene una cita programada');

            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
        });
    });

    describe('getById', () => {
        it('debería retornar null si la cita no existe', async () => {
            mockPool.query.mockResolvedValueOnce({ rows: [] });

            const result = await appointmentService.getById('non-existent', 'spa-uuid');

            expect(result).toBeNull();
        });

        it('debería retornar cita con servicios', async () => {
            mockPool.query
                .mockResolvedValueOnce({ rows: [{ id: '1', client_name: 'John' }] }) // Appointment
                .mockResolvedValueOnce({ rows: [{ id: 's1', name: 'Massage' }] }); // Services

            const result = await appointmentService.getById('1', 'spa-uuid');

            expect(result.client_name).toBe('John');
            expect(result.services).toHaveLength(1);
        });
    });
});
