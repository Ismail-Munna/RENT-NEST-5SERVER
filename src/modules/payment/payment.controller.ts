import { Request, Response } from "express";
import httpStatus from "http-status";
import Stripe from "stripe";
import config from "../../config/index";
import { prisma } from "../../lib/prisma";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { paymentService } from "./payment.service";
import { ApiError } from "../../utils/ApiError";

let stripeInstance: Stripe | null = null;
const getStripe = (): Stripe => {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Stripe secret key is missing in .env file");
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16" as any,
    });
  }
  return stripeInstance;
};

const createPayment = catchAsync(async (req: Request, res: Response) => {
  const stripe = getStripe();
  const payload = req.body;
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Authentication required");
  }

  if (!payload.rentalRequestId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "rentalRequestId is required");
  }

  const rentalRequest = await prisma.rentalRequest.findUnique({
    where: { id: payload.rentalRequestId },
    include: { property: true },
  });

  if (!rentalRequest) {
    throw new ApiError(httpStatus.NOT_FOUND, "Rental request not found");
  }

  // 1. Double Payment Prevention: Check rentalRequest status
  const requestStatus = String(rentalRequest.status).toUpperCase();
  if (requestStatus === "ACTIVE" || requestStatus === "COMPLETED") {
    throw new ApiError(httpStatus.BAD_REQUEST, "This request has already been paid for.");
  }

  if (rentalRequest.status !== "APPROVED") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Rental request must be approved by the landlord before payment");
  }

  const amount = payload.amount || rentalRequest.property.price;
  const title = rentalRequest.property.title || "Rental Property Payment";

  // 2. Stripe Checkout Session Integration
  // Point Stripe redirect callback directly to backend payments/success handler
  const backendUrl = process.env.BACKEND_API_URL || config.app_url || "http://localhost:3000";
  const host = req.get("host");
  const protocol = req.protocol;
  const currentAppUrl = host?.includes("localhost") ? `${protocol}://${host}` : (process.env.APP_URL || `${protocol}://${host}`);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: title,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${currentAppUrl}/api/payments/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_URL || currentAppUrl}/cancel`,
    metadata: {
      rentalRequestId: rentalRequest.id.toString(),
      userId,
    },
  });

  // Create local payment record
  await prisma.payment.create({
    data: {
      rentalRequestId: payload.rentalRequestId,
      amount,
      method: payload.method || "CARD",
      provider: "STRIPE",
      status: "PENDING",
      userId,
      transactionId: session.id,
    },
  });

  // 3. Return Stripe Session URL
  res.status(200).json({ success: true, url: session.url });
});

const handlePaymentSuccess = catchAsync(async (req: Request, res: Response) => {
  const { session_id } = req.query;

  if (!session_id || typeof session_id !== "string") {
    throw new ApiError(httpStatus.BAD_REQUEST, "session_id is required");
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(session_id);

  const rentalRequestId = session.metadata?.rentalRequestId;

  if (!rentalRequestId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "rentalRequestId not found in session metadata");
  }

  // Find payment and mark as COMPLETED
  const payment = await prisma.payment.findFirst({
    where: { transactionId: session.id },
  }) || await prisma.payment.findFirst({
    where: { rentalRequestId },
  });

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED" as any,
        transactionId: session_id,
        paidAt: new Date(),
      },
    });
  }

  // Update RentalRequest status to ACTIVE
  await prisma.rentalRequest.update({
    where: { id: rentalRequestId },
    data: { status: "ACTIVE" as any },
  });

  // Update related property status to BOOKED
  const rental = await prisma.rentalRequest.findUnique({
    where: { id: rentalRequestId },
  });
  if (rental) {
    await prisma.property.update({
      where: { id: rental.propertyId },
      data: { status: "BOOKED" as any },
    });
  }

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";
  return res.redirect('http://localhost:3001/payment/success');
});

const confirmPayment = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const payment = await paymentService.confirmPayment(payload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment confirmed successfully",
    data: { payment },
  });
});

const getMyPayments = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Authentication required");
  }

  const payments = await paymentService.getMyPayments(userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payments fetched successfully",
    data: { payments },
  });
});

const getPaymentById = catchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const userId = req.user?.id;

  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Payment id is required");
  }

  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Authentication required");
  }

  const payment = await paymentService.getPaymentById(id, userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment fetched successfully",
    data: { payment },
  });
});

export const paymentController = {
  createPayment,
  handlePaymentSuccess,
  confirmPayment,
  getMyPayments,
  getPaymentById,
};
