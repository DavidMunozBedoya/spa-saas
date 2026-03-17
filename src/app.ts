import express from "express";
import helmet from "helmet";
import cors from "cors";

import pool from "./config/db.js";

import spaRouter from "./modules/spas/spa.router.js";
import staffRouter from "./modules/staff/staff.router.js";
import userRouter from "./modules/users/user.router.js";
import clientRouter from "./modules/clients/client.router.js";
import serviceRouter from "./modules/services/service.router.js";
import appointmentRouter from "./modules/appointments/appointment.router.js";
import authRouter from "./modules/auth/auth.router.js";
import platformRouter from "./modules/platform/platform.router.js";
import reportsRouter from "./modules/reports/reports.router.js";
import invoiceRouter from "./modules/invoices/invoice.router.js";
import { authenticateToken, authorizePermission } from "./middleware/auth.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));

// Ruta de Autenticación (Pública)
app.use("/api/auth", authRouter);

// Ruta de Plataforma (Interna de SuperAdmin)
app.use("/api/platform", authenticateToken, authorizePermission("platform:manage"), platformRouter);

// Rutas Protegidas
app.use("/api/spas", authenticateToken, spaRouter);
app.use("/api/staff", authenticateToken, staffRouter);
app.use("/api/users", authenticateToken, userRouter);
app.use("/api/clients", authenticateToken, clientRouter);
app.use("/api/services", authenticateToken, serviceRouter);
app.use("/api/appointments", authenticateToken, appointmentRouter);
app.use("/api/reports", authenticateToken, reportsRouter);
app.use("/api/invoices", authenticateToken, invoiceRouter);

app.get("/health", (_req, res) => {
    return res.json({ status: "ok" });
});

// Endpoint de diagnóstico (Solo Admin)
app.get("/api/testing/db-status", authenticateToken, authorizePermission("platform:manage"), async (_req, res) => {
    try {
        const result = await pool.query('SELECT NOW(), version()');
        return res.json({
            status: "connected",
            time: result.rows[0].now,
            version: result.rows[0].version
        });
    } catch (error: any) {
        return res.status(500).json({
            status: "error",
            message: error.message
        });
    }
});

// Manejador Global de Errores
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(`[ERROR] ${req.method} ${req.url}:`, err);

    const status = err.status || 500;
    const message = err.message || "Error interno del servidor";

    res.status(status).json({
        error: message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
});

export default app;
