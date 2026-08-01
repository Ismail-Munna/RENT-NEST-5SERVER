import { Router } from "express";
import { paymentController } from "./payment.controller";
import { authenticate, authorizeRoles } from "../../middlewares/auth.middleware";

const router = Router();

// 1. Post/Create Session Initiation (Secure)
router.post("/create", authenticate, authorizeRoles("TENANT"), paymentController.createPayment);
router.post("/confirm", authenticate, authorizeRoles("TENANT"), paymentController.confirmPayment);

// 2. Stripe checkout redirect handler (Public callback - must be declared BEFORE /:id to avoid wildcard capture)
router.get("/success", paymentController.handlePaymentSuccess);

// 3. User lists (Secure)
router.get("/", authenticate, authorizeRoles("TENANT"), paymentController.getMyPayments);
router.get("/:id", authenticate, authorizeRoles("TENANT"), paymentController.getPaymentById);

export const paymentRoutes = router;
