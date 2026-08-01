import { Router } from "express";
import { landlordController } from "./landlord.controller";
import { authenticate, authorizeRoles } from "../../middlewares/auth.middleware";

const router = Router();

router.get(
  "/properties",
  authenticate,
  authorizeRoles("LANDLORD"),
  landlordController.getLandlordProperties
);
router.post(
  "/properties",
  authenticate,
  authorizeRoles("LANDLORD"),
  landlordController.createProperty
);
router.put(
  "/properties/:id",
  authenticate,
  authorizeRoles("LANDLORD"),
  landlordController.updateProperty
);
router.delete(
  "/properties/:id",
  authenticate,
  authorizeRoles("LANDLORD"),
  landlordController.deleteProperty
);
router.get(
  "/requests",
  authenticate,
  authorizeRoles("LANDLORD"),
  landlordController.getRentalRequests
);
router.patch(
  "/requests/:id",
  authenticate,
  authorizeRoles("LANDLORD"),
  landlordController.updateRentalRequestStatus
);

export const landlordRoutes = router;
