import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import config from "../config/index";
import { prisma } from "../lib/prisma";
import { jwtUtils } from "../utils/jwt";
import { ApiError } from "../utils/ApiError";

const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const tokenFromCookie = req.cookies?.accessToken;
    const tokenFromHeader = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : undefined;
    const token = tokenFromCookie || tokenFromHeader;

    if (!token) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Authentication token is required");
    }

    const verifiedToken = jwtUtils.verifyToken(token, config.jwt_access_secret);

    if (!verifiedToken.success || typeof verifiedToken.data !== "object" || verifiedToken.data === null) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid or expired token");
    }

    const tokenPayload = verifiedToken.data as { id?: string };

    if (!tokenPayload.id) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token payload");
    }

    const user = await prisma.user.findUnique({
      where: { id: tokenPayload.id },
    });

    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "User not found");
    }

    if (user.status === "BANNED") {
      throw new ApiError(httpStatus.FORBIDDEN, "Your account has been blocked. Please contact support.");
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    console.log("[AUTH] req.user set:", JSON.stringify(req.user));

    next();
  } catch (error) {
    next(error);
  }
};

const authorizeRoles = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user || !roles.includes(req.user.role)) {
        throw new ApiError(httpStatus.FORBIDDEN, "You are not authorized to access this resource");
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

export { authenticate, authorizeRoles };
