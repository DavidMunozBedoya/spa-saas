import { Router } from "express";
import { AppointmentController } from "./appointment.controller.js";
import { validate } from "../../middleware/validate.js";
import { CreateAppointmentSchema, UpdateAppointmentStatusSchema, UpdateAppointmentSchema } from "./appointment.schema.js";

import { authenticateToken, authorizePermission } from "../../middleware/auth.js";

const router = Router();
const appointmentController = new AppointmentController();

router.use(authenticateToken);

router.post("/", authorizePermission("appointments:create"), validate(CreateAppointmentSchema), appointmentController.create);
router.get("/", authorizePermission("appointments:view"), appointmentController.getBySpa);
router.get("/:id", authorizePermission("appointments:view"), appointmentController.getById);
router.put("/:id", authorizePermission("appointments:edit"), validate(UpdateAppointmentSchema), appointmentController.update);
router.patch("/:id/status", authorizePermission("appointments:edit"), validate(UpdateAppointmentStatusSchema), appointmentController.updateStatus);

export default router;
