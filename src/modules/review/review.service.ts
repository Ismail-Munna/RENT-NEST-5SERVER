import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { ICreateReviewPayload } from "./review.interface";

const createReview = async (payload: ICreateReviewPayload, userId: string) => {
  if (!payload.propertyId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Property ID is required");
  }

  if (payload.rating === undefined || payload.rating < 1 || payload.rating > 5) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Rating must be an integer between 1 and 5");
  }

  const property = await prisma.property.findUnique({ where: { id: payload.propertyId } });

  if (!property) {
    throw new ApiError(httpStatus.NOT_FOUND, "Property not found");
  }

  return prisma.review.create({
    data: {
      propertyId: payload.propertyId,
      userId,
      rating: Math.round(payload.rating),
      comment: payload.comment,
    },
    include: {
      user: {
        select: { id: true, name: true },
      },
      property: {
        select: { id: true, title: true },
      },
    },
  });
};

export const reviewService = {
  createReview,
};
