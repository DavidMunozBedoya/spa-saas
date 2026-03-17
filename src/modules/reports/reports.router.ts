import { Router } from "express";
import { ReportsController } from "./reports.controller.js";
import { authenticateToken, authorizePermission } from "../../middleware/auth.js";

const router = Router();
const reportsController = new ReportsController();

// Todas las rutas de reportes requieren autenticación de Spa
router.use(authenticateToken);
router.use(authorizePermission("reports:view"));

router.get("/stats", reportsController.getStats);
router.get("/staff", reportsController.getStaffReport);
router.get("/services", reportsController.getServiceReport);

export default router;
