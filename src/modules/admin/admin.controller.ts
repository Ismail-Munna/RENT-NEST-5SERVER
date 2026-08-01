import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { adminService } from "./admin.service";
import { ApiError } from "../../utils/ApiError";

const getAllUsers = catchAsync(async (_req: Request, res: Response) => {
  const users = await adminService.getAllUsers();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Users fetched successfully",
    data: { users },
  });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { status } = req.body;

  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User id is required");
  }

  const user = await adminService.updateUserStatus(id, status);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User status updated successfully",
    data: { user },
  });
});

const getAllProperties = catchAsync(async (_req: Request, res: Response) => {
  const properties = await adminService.getAllProperties();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Properties fetched successfully",
    data: { properties },
  });
});

const deleteProperty = catchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Property id is required");
  }

  const property = await adminService.deleteProperty(id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Property deleted by admin successfully",
    data: { property },
  });
});

const getAllRentalRequests = catchAsync(async (_req: Request, res: Response) => {
  const rentalRequests = await adminService.getAllRentalRequests();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Rental requests fetched successfully",
    data: { rentals: rentalRequests },
  });
});

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const category = await adminService.createCategory(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Category created successfully",
    data: { category },
  });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Category id is required");
  }

  const category = await adminService.updateCategory(id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Category updated successfully",
    data: { category },
  });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Category id is required");
  }

  const category = await adminService.deleteCategory(id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Category deleted successfully",
    data: { category },
  });
});

export const adminController = {
  getAllUsers,
  updateUserStatus,
  getAllProperties,
  deleteProperty,
  getAllRentalRequests,
  createCategory,
  updateCategory,
  deleteCategory,
};
