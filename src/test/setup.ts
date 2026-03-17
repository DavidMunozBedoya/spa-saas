import { vi } from 'vitest';

/**
 * Utilidad para mockear el pool de pg.
 */
export const mockPool = {
    query: vi.fn(),
    connect: vi.fn().mockReturnValue({
        query: vi.fn(),
        release: vi.fn(),
    }),
    end: vi.fn(),
};

// Mockeamos el módulo de configuración de db antes de que se importe en los servicios
vi.mock('../config/db.js', () => ({
    default: mockPool
}));
