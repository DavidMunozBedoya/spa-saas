import { Router } from "express";
import { StaffController } from "./staff.controller.js";
import { validate } from "../../middleware/validate.js";
import { CreateStaffSchema, UpdateStaffSchema } from "./staff.schema.js";
import { authenticateToken, authorizePermission } from "../../middleware/auth.js";

const router = Router();
const staffController = new StaffController();

router.use(authenticateToken);

router.post("/", authorizePermission("staff:manage"), validate(CreateStaffSchema), staffController.create);
router.get("/", authorizePermission("staff:view"), staffController.getBySpa);
router.get("/therapists", authorizePermission("staff:view"), staffController.getTherapists);
router.get("/:id", authorizePermission("staff:view"), staffController.getById);
router.patch("/:id", authorizePermission("staff:manage"), validate(UpdateStaffSchema), staffController.update);
router.delete("/:id", authorizePermission("staff:manage"), staffController.delete);
router.patch("/:id/reactivate", authorizePermission("staff:manage"), staffController.reactivate);

export default router;
