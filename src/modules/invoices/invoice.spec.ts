import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config/db.js', () => ({
    default: {
        query: vi.fn(),
        connect: vi.fn(),
        end: vi.fn(),
    }
}));

import pool from '../../config/db.js';
import { InvoiceService } from './invoice.service.js';

describe('InvoiceService', () => {
    let invoiceService: InvoiceService;
    const mockPool = pool as any;
    const mockClient = {
        query: vi.fn(),
        release: vi.fn(),
    };

    beforeEach(() => {
        invoiceService = new InvoiceService();
        vi.clearAllMocks();
        mockPool.connect.mockResolvedValue(mockClient);
    });

    describe('liquidateAppointment', () => {
        it('debería liquidar una cita calculando subtotal, IVA y total correctamente', async () => {
            const appointmentData = {
                id: 'apt-uuid',
                spa_id: 'spa-uuid',
                client_id: 'client-uuid',
                status: 'BOOKED',
                service_prices: [50, 100] // Subtotal = 150
            };

            // Mocks de la transacción
            mockClient.query
                .mockResolvedValueOnce({}) // BEGIN
                .mockResolvedValueOnce({ rows: [appointmentData] }) // Get Apt & Services
                .mockResolvedValueOnce({ rows: [{ id: 'invoice-uuid' }] }) // Insert Invoice
                .mockResolvedValueOnce({}) // Update Appointment Status
                .mockResolvedValueOnce({}); // COMMIT

            // Mock de getInvoiceById que se llama al final
            mockPool.query
                .mockResolvedValueOnce({
                    rows: [{
                        id: 'invoice-uuid',
                        appointment_id: 'apt-uuid',
                        subtotal: 150,
                        tax: 28.5,
                        total: 178.5,
                        spa_name: 'Test Spa',
                        client_name: 'Test Client'
                    }]
                }) // Invoice details
                .mockResolvedValueOnce({ rows: [{ name: 'S1', price: 50 }, { name: 'S2', price: 100 }] }); // Services details

            const result = await invoiceService.liquidateAppointment({
                appointment_id: 'apt-uuid',
                tax_rate: 0.19, // 19% IVA
                payment_method: 'CASH'
            });

            expect(result.subtotal).toBe(150);
            expect(result.tax).toBe(28.5);
            expect(result.total).toBe(178.5);
            expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining("UPDATE appointments SET status = 'COMPLETED'"), expect.any(Array));
        });

        it('debería fallar si la cita no existe', async () => {
            mockClient.query
                .mockResolvedValueOnce({}) // BEGIN
                .mockResolvedValueOnce({ rows: [] }); // Get Apt fails

            await expect(invoiceService.liquidateAppointment({
                appointment_id: 'invalid',
                tax_rate: 0
            })).rejects.toThrow('Cita no encontrada');

            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
        });
    });
});
