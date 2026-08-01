import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import {
  ICreatePropertyPayload,
  IUpdatePropertyPayload,
  IUpdateRentalRequestPayload,
} from "./landlord.interface";

const getLandlordProperties = async (landlordId: string) => {
  // Ensure we filter properties by the exact logged-in landlord ID
  return prisma.property.findMany({
    where: { landlordId: String(landlordId) },
    include: {
      category: true,
      reviews: {
        select: {
          id: true,
          rating: true,
          comment: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

const createProperty = async (payload: ICreatePropertyPayload, landlordId: string) => {
  if (!payload.title || !payload.location || !payload.city || payload.price === undefined) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Title, location, city, and price are required");
  }

  return prisma.property.create({
    data: {
      ...payload,
      landlordId: String(landlordId),
      status: payload.status ?? "AVAILABLE",
    },
    include: {
      category: true,
    },
  });
};

const updateProperty = async (
  propertyId: string,
  landlordId: string,
  payload: IUpdatePropertyPayload
) => {
  const existingProperty = await prisma.property.findUnique({
    where: { id: String(propertyId) },
  });

  if (!existingProperty) {
    throw new ApiError(httpStatus.NOT_FOUND, "Property not found");
  }

  // Type safety ownership check using explicit String casting
  if (String(existingProperty.landlordId) !== String(landlordId)) {
    throw new ApiError(httpStatus.FORBIDDEN, "You are not authorized to update this property");
  }

  return prisma.property.update({
    where: { id: String(propertyId) },
    data: payload,
    include: {
      category: true,
    },
  });
};

const deleteProperty = async (propertyId: string, landlordId: string) => {
  // 1. Locate property by ID first
  const existingProperty = await prisma.property.findUnique({
    where: { id: String(propertyId) },
  });

  if (!existingProperty) {
    throw new ApiError(httpStatus.NOT_FOUND, "Property not found");
  }

  // 2. Ownership check: Ensure type safety by converting both to strings before comparing
  if (String(existingProperty.landlordId) !== String(landlordId)) {
    throw new ApiError(httpStatus.FORBIDDEN, "You are not authorized to delete this property");
  }

  // 3. Delete property via Prisma
  await prisma.property.delete({
    where: { id: String(propertyId) },
  });

  return existingProperty;
};

const getRentalRequests = async (landlordId: string) => {
  return prisma.rentalRequest.findMany({
    where: {
      property: {
        landlordId: String(landlordId),
      },
    },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          location: true,
          city: true,
          price: true,
          status: true,
        },
      },
      tenant: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      payments: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const updateRentalRequestStatus = async (
  requestId: string,
  landlordId: string,
  payload: IUpdateRentalRequestPayload
) => {
  const request = await prisma.rentalRequest.findUnique({
    where: { id: String(requestId) },
    include: {
      property: true,
    },
  });

  if (!request) {
    throw new ApiError(httpStatus.NOT_FOUND, "Rental request not found");
  }

  if (String(request.property.landlordId) !== String(landlordId)) {
    throw new ApiError(httpStatus.FORBIDDEN, "You are not authorized to manage this rental request");
  }

  if (!payload.status || !["APPROVED", "REJECTED", "PENDING"].includes(payload.status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Valid request status (APPROVED, REJECTED, PENDING) is required");
  }

  return prisma.$transaction(async (tx) => {
    const updatedRequest = await tx.rentalRequest.update({
      where: { id: String(requestId) },
      data: { status: payload.status },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            price: true,
            status: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (payload.status === "APPROVED") {
      await tx.property.update({
        where: { id: request.propertyId },
        data: { status: "BOOKED" },
      });
    } else if (payload.status === "REJECTED") {
      await tx.property.update({
        where: { id: request.propertyId },
        data: { status: "AVAILABLE" },
      });
    }

    return updatedRequest;
  });
};

export const landlordService = {
  getLandlordProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  getRentalRequests,
  updateRentalRequestStatus,
};
