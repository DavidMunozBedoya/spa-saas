import { Router } from "express";
import { InvoiceController } from "./invoice.controller.js";
import { authenticateToken, authorizePermission } from "../../middleware/auth.js";

const router = Router();
const invoiceController = new InvoiceController();

router.use(authenticateToken);

router.get("/", authorizePermission("invoices:view"), invoiceController.list);
router.post("/liquidate", authorizePermission("invoices:manage"), invoiceController.liquidate);
router.get("/:id", authorizePermission("invoices:view"), invoiceController.getById);
router.get("/:id/pdf", authorizePermission("invoices:view"), invoiceController.getPDF);

export default router;
