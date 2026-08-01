import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { rentalService } from "./rental.service";
import { ApiError } from "../../utils/ApiError";

const createRentalRequest = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const tenantId = req.user?.id;

  if (!tenantId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Authentication required");
  }

  const rentalRequest = await rentalService.createRentalRequest(payload, tenantId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Rental request submitted successfully",
    data: { rentalRequest },
  });
});

const getMyRentalRequests = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user?.id;

  if (!tenantId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Authentication required");
  }

  const rentalRequests = await rentalService.getMyRentalRequests(tenantId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Rental requests fetched successfully",
    data: { rentals: rentalRequests },
  });
});

const getRentalRequestById = catchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const tenantId = req.user?.id;

  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Rental request id is required");
  }

  if (!tenantId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Authentication required");
  }

  const rentalRequest = await rentalService.getRentalRequestById(id, tenantId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Rental request fetched successfully",
    data: { rentalRequest },
  });
});

export const rentalController = {
  createRentalRequest,
  getMyRentalRequests,
  getRentalRequestById,
};
