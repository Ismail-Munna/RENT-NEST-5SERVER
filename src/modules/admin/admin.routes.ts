import { Router } from "express";
import { adminController } from "./admin.controller";
import { authenticate, authorizeRoles } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/users", authenticate, authorizeRoles("ADMIN"), adminController.getAllUsers);
router.patch("/users/:id", authenticate, authorizeRoles("ADMIN"), adminController.updateUserStatus);

router.get("/properties", authenticate, authorizeRoles("ADMIN"), adminController.getAllProperties);
router.delete("/properties/:id", authenticate, authorizeRoles("ADMIN"), adminController.deleteProperty);

// Both /requests and /rentals will map to fetching all rental requests to satisfy different callers
router.get("/requests", authenticate, authorizeRoles("ADMIN"), adminController.getAllRentalRequests);
router.get("/rentals", authenticate, authorizeRoles("ADMIN"), adminController.getAllRentalRequests);

router.post("/categories", authenticate, authorizeRoles("ADMIN"), adminController.createCategory);
router.patch("/categories/:id", authenticate, authorizeRoles("ADMIN"), adminController.updateCategory);
router.delete("/categories/:id", authenticate, authorizeRoles("ADMIN"), adminController.deleteCategory);

export const adminRoutes = router;
