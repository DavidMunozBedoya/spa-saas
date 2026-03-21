import { AppointmentRepository } from "./appointment.repository.js";
import { CreateAppointmentInput, UpdateAppointmentInput } from "./appointment.schema.js";
import { PoolClient } from "pg";

const repository = new AppointmentRepository();

export class AppointmentService {
    /**
     * Verifica conflictos de horario para el profesional o el cliente delegando al repositorio.
     */
    private async checkOverlaps(
        client: PoolClient,
        data: {
            staff_id: string;
            client_id: string;
            start_time: string;
            end_time: string;
            timezone_offset?: number | null;
            exclude_appointment_id?: string;
        }
    ) {
        const offset = data.timezone_offset ?? 0;
        const formatLocalTime = (utcDate: Date) => {
            const localDate = new Date(utcDate.getTime() + offset * 60000);
            return localDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        };

        // 1. Verificar solapamiento para el staff
        const staffOverlap = await repository.checkStaffOverlap(
            data.staff_id, 
            data.start_time, 
            data.end_time, 
            data.exclude_appointment_id, 
            client
        );

        if (staffOverlap) {
            const formattedEnd = formatLocalTime(staffOverlap.end_time);
            throw new Error(`¡ATENCIÓN! El profesional ${staffOverlap.staff_name} ya tiene una cita en este rango. Por favor, intenta agendar después de las ${formattedEnd}.`);
        }

        // 2. Verificar solapamiento para el cliente
        const clientOverlap = await repository.checkClientOverlap(
            data.client_id, 
            data.start_time, 
            data.end_time, 
            data.exclude_appointment_id, 
            client
        );

        if (clientOverlap) {
            const formattedEnd = formatLocalTime(clientOverlap.end_time);
            throw new Error(`¡ATENCIÓN! El cliente ${clientOverlap.client_name} tiene otra reserva que interfiere con este horario. Debe agendarse después de las ${formattedEnd}.`);
        }
    }

    /**
     * Crea una cita dentro de una transacción. Verifica solapamientos de tiempo para el staff.
     */
    async createAppointment(data: CreateAppointmentInput) {
        const {
            spa_id, client_id, staff_id, service_ids, start_time, end_time,
            client_identity, client_name, client_email, client_phone,
            client_birth_date,
            timezone_offset = 0
        } = data;

        const client = await repository.getTransaction();
        try {
            await client.query("BEGIN");

            let resolvedClientId = client_id;

            // Lógica de Identificación Inteligente: Buscar o Crear Cliente
            if (!resolvedClientId && client_identity) {
                const existingClient = await repository.getClientByIdentity(spa_id, client_identity, client);

                if (existingClient) {
                    resolvedClientId = existingClient.id;
                } else if (client_name) {
                    try {
                        resolvedClientId = await repository.createClient({
                            spa_id,
                            full_name: client_name,
                            identity_number: client_identity,
                            email: client_email,
                            phone: client_phone,
                            birth_date: client_birth_date
                        }, client);
                    } catch (err: any) {
                        if (err.code === '23505' && err.constraint?.includes('identity_number')) {
                            throw new Error("Esta identificación ya está registrada para otro cliente.");
                        }
                        throw err;
                    }
                }
            }

            if (!resolvedClientId) {
                throw new Error("Se requiere la identificación y el nombre completo para registrar a un nuevo cliente.");
            }

            // 0. Verificar solapamiento de horarios (Staff y Cliente)
            await this.checkOverlaps(client, {
                staff_id,
                client_id: resolvedClientId,
                start_time,
                end_time,
                timezone_offset
            });

            // 1. Insertar la cita principal y servicios asociados
            const result = await repository.createAppointment(
                { spa_id, client_id: resolvedClientId, staff_id, start_time, end_time },
                service_ids,
                client
            );

            await client.query("COMMIT");
            return result;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Obtiene todas las citas de un Spa con información de cliente y personal.
     */
    async getBySpa(spa_id: string, filters?: { status?: string, startDate?: string, endDate?: string, limit?: number, offset?: number, staff_id?: string }) {
        const result = await repository.getBySpa(spa_id, filters || {});
        
        return {
            appointments: result.appointments,
            pagination: {
                total: result.total,
                limit: filters?.limit || result.appointments.length,
                offset: filters?.offset || 0
            }
        };
    }

    /**
     * Obtiene los detalles de una cita específica, incluyendo sus servicios.
     */
    async getById(id: string, spa_id: string) {
        return repository.getById(id, spa_id);
    }

    /**
     * Actualiza una cita completa (personal, servicios, tiempos).
     */
    async updateAppointment(data: UpdateAppointmentInput) {
        const { id, spa_id, staff_id, service_ids, start_time, end_time, timezone_offset = 0 } = data;

        const client = await repository.getTransaction();
        try {
            await client.query("BEGIN");

            // 1. Verificar existencia y pertenencia
            const existing = await repository.getBaseFields(id, spa_id, client);
            if (!existing) throw new Error("Cita no encontrada");

            // 2. Si cambian tiempos o staff, verificar solapamientos (excluyendo esta cita)
            const finalStaffId = staff_id || existing.staff_id;
            const finalStartTime = start_time || existing.start_time.toISOString();
            const finalEndTime = end_time || existing.end_time.toISOString();

            if (staff_id || start_time || end_time) {
                await this.checkOverlaps(client, {
                    staff_id: finalStaffId,
                    client_id: existing.client_id,
                    start_time: finalStartTime,
                    end_time: finalEndTime,
                    timezone_offset,
                    exclude_appointment_id: id
                });
            }

            // 3. Actualizar campos básicos
            await repository.updateAppointment(
                id, spa_id,
                { staff_id, start_time, end_time },
                service_ids,
                client
            );

            await client.query("COMMIT");
            return repository.getById(id, spa_id);
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Actualiza el estado de una cita.
     */
    async updateStatus(id: string, spa_id: string, status: string) {
        return repository.updateStatus(id, spa_id, status);
    }
}
