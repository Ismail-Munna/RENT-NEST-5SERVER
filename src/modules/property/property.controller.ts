import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { propertyService } from "./property.service";
import { ApiError } from "../../utils/ApiError";

const getAllProperties = catchAsync(async (req: Request, res: Response) => {
  const properties = await propertyService.getAllProperties(req.query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Properties fetched successfully",
    data: { properties },
  });
});

const getPropertyById = catchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Property id is required");
  }

  const property = await propertyService.getPropertyById(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Property fetched successfully",
    data: { property },
  });
});

export const propertyController = {
  getAllProperties,
  getPropertyById,
};
