import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { landlordService } from "./landlord.service";
import { ApiError } from "../../utils/ApiError";

const getLandlordProperties = catchAsync(async (req: Request, res: Response) => {
  const landlordId = req.user?.id;

  if (!landlordId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Authentication required");
  }

  const properties = await landlordService.getLandlordProperties(landlordId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Landlord properties fetched successfully",
    data: { properties },
  });
});

const createProperty = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const landlordId = req.user?.id;

  if (!landlordId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Authentication required");
  }

  const property = await landlordService.createProperty(payload, landlordId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Property created successfully",
    data: { property },
  });
});

const updateProperty = catchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const payload = req.body;
  const landlordId = req.user?.id;

  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Property id is required");
  }

  if (!landlordId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Authentication required");
  }

  const property = await landlordService.updateProperty(id, landlordId, payload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Property updated successfully",
    data: { property },
  });
});

const deleteProperty = catchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const landlordId = req.user?.id;

  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Property id is required");
  }

  if (!landlordId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Authentication required");
  }

  const property = await landlordService.deleteProperty(id, landlordId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Property deleted successfully",
    data: { property },
  });
});

const getRentalRequests = catchAsync(async (req: Request, res: Response) => {
  const landlordId = req.user?.id;

  if (!landlordId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Authentication required");
  }

  const requests = await landlordService.getRentalRequests(landlordId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Rental requests fetched successfully",
    data: { requests },
  });
});

const updateRentalRequestStatus = catchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const payload = req.body;
  const landlordId = req.user?.id;

  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Rental request id is required");
  }

  if (!landlordId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Authentication required");
  }

  const request = await landlordService.updateRentalRequestStatus(id, landlordId, payload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Rental request status updated successfully",
    data: { request },
  });
});

export const landlordController = {
  getLandlordProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  getRentalRequests,
  updateRentalRequestStatus,
};
