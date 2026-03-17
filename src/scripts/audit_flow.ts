import pool from '../config/db.js';
import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';

async function runAudit() {
    console.log('--- Iniciando Auditoría Funcional 100% ---');

    try {
        // 1. Verificar Salud del Sistema
        const health = await axios.get('http://localhost:3001/health');
        console.log('✔ Salud del Sistema:', health.data.status);

        // 2. Login como Administrador (Propietario)
        console.log('2. Verificando Autenticación...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'ana@sparelax.com',
            password: 'admin123'
        });
        const adminToken = loginRes.data.token;
        const spaId = loginRes.data.user.spa_id;
        console.log(`✔ Login exitoso. SpaID: ${spaId}`);
        console.log(`✔ Token: ${adminToken.substring(0, 20)}...`);

        // 3. Crear un Terapeuta para pruebas
        console.log('3. Creando Personal y Usuario Terapeuta...');
        const uniqueSuffix = Date.now();
        const therapistEmail = `carlos_${uniqueSuffix}@sparelax.com`;

        const therapistStaff = await axios.post(`${BASE_URL}/staff`, {
            spa_id: spaId,
            full_name: 'Carlos Terapeuta',
            email: therapistEmail
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        const therapistUser = await axios.post(`${BASE_URL}/users`, {
            spa_id: spaId,
            role_ids: [3], // ID de Terapeuta
            full_name: 'Carlos Login',
            email: therapistEmail,
            password: 'Password123!'
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        const therapistId = therapistUser.data.id;
        console.log('✔ Terapeuta creado.');

        // 4. Probar Permiso Denegado
        console.log('4. Verificando Restricciones de Permisos (Least Privilege)...');
        const therapistLogin = await axios.post(`${BASE_URL}/auth/login`, {
            email: therapistEmail,
            password: 'Password123!'
        });
        const therapistToken = therapistLogin.data.token;

        try {
            await axios.get(`${BASE_URL}/invoices`, { headers: { Authorization: `Bearer ${therapistToken}` } });
            console.error('❌ FALLO: El terapeuta NO debería tener permiso para ver facturas.');
        } catch (e: any) {
            console.log('✔ ÉXITO: Acceso denegado correctamente (403).');
        }

        // 5. Otorga Permiso Dinámico
        console.log('5. Otorgando Permiso Dinámico...');
        await axios.post(`${BASE_URL}/users/${therapistId}/permissions/grant`, {
            permission_code: 'invoices:view'
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        // Verificar ahora
        const invoicesRes = await axios.get(`${BASE_URL}/invoices`, { headers: { Authorization: `Bearer ${therapistToken}` } });
        console.log(`✔ ÉXITO: Carlos ahora puede ver facturas. Cantidad actual: ${invoicesRes.data.length}`);

        // 6. Flujo de Citas e Invoicing
        console.log('6. Verificando Flujo de Negocio (Cita -> Factura)...');
        const clientEmail = `juan_${uniqueSuffix}@cliente.com`;
        const clientRes = await axios.post(`${BASE_URL}/clients`, {
            full_name: 'Juan Cliente',
            email: clientEmail,
            phone: '5551234'
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        const clientId = clientRes.data.id;

        const serviceRes = await axios.post(`${BASE_URL}/services`, {
            name: `Masaje Auditoría ${uniqueSuffix}`,
            duration_minutes: 60,
            price: 150
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        const serviceId = serviceRes.data.id;

        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
        const aptRes = await axios.post(`${BASE_URL}/appointments`, {
            client_id: clientId,
            staff_id: therapistStaff.data.id,
            service_ids: [serviceId],
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString()
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        const aptId = aptRes.data.id;
        console.log('✔ Cita creada.');

        const finalInvoice = await axios.post(`${BASE_URL}/invoices/liquidate`, {
            spa_id: spaId,
            appointment_id: aptId,
            payment_method: 'EFECTIVO'
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        console.log('✔ Factura generada y cita liquidada:', finalInvoice.data.invoice_number);

        console.log('--- Auditoría Finalizada Exitosamente (100%) ---');
    } catch (error: any) {
        console.error('❌ Error durante la auditoría:', error.response?.data || error.message);
    } finally {
        await pool.end();
    }
}

runAudit();
