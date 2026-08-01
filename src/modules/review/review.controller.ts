import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { reviewService } from "./review.service";
import { ApiError } from "../../utils/ApiError";

const createReview = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Authentication required");
  }

  const review = await reviewService.createReview(payload, userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Review created successfully",
    data: { review },
  });
});

export const reviewController = {
  createReview,
};
