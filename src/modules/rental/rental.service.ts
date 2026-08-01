import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { ICreateRentalRequestPayload, IUpdateRentalRequestPayload } from "./rental.interface";

const createRentalRequest = async (payload: ICreateRentalRequestPayload, tenantId: string) => {
  if (!payload.propertyId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Property ID is required");
  }

  const property = await prisma.property.findUnique({ where: { id: payload.propertyId } });

  if (!property) {
    throw new ApiError(httpStatus.NOT_FOUND, "Property not found");
  }

  if (property.status !== "AVAILABLE") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Property is not available for rental requests");
  }

  const existingPendingRequest = await prisma.rentalRequest.findFirst({
    where: {
      propertyId: payload.propertyId,
      tenantId: String(tenantId),
      status: "PENDING",
    },
  });

  if (existingPendingRequest) {
    throw new ApiError(httpStatus.CONFLICT, "You already have a pending rental request for this property");
  }

  return prisma.rentalRequest.create({
    data: {
      propertyId: payload.propertyId,
      tenantId: String(tenantId),
      status: "PENDING",
      message: payload.message,
    },
    include: {
      property: {
        include: {
          category: true,
          landlord: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      },
      payments: true,
    },
  });
};

const getMyRentalRequests = async (tenantId: string) => {
  return prisma.rentalRequest.findMany({
    where: { tenantId: String(tenantId) },
    include: {
      property: true,
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

const getRentalRequestById = async (rentalRequestId: string, tenantId: string) => {
  const rentalRequest = await prisma.rentalRequest.findFirst({
    where: { id: rentalRequestId, tenantId: String(tenantId) },
    include: {
      property: true,
      payments: true,
    },
  });

  if (!rentalRequest) {
    throw new ApiError(httpStatus.NOT_FOUND, "Rental request not found");
  }

  return rentalRequest;
};

const updateRentalRequestStatus = async (
  rentalRequestId: string,
  payload: IUpdateRentalRequestPayload
) => {
  return prisma.rentalRequest.update({
    where: { id: rentalRequestId },
    data: payload,
  });
};

export const rentalService = {
  createRentalRequest,
  getMyRentalRequests,
  getRentalRequestById,
  updateRentalRequestStatus,
};
