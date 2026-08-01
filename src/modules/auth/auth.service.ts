import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import config from "../../config/index";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { jwtUtils } from "../../utils/jwt";
import { userService } from "../user/user.service";
import { ILoginUser } from "./auth.interface";

interface IRegisterUserPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: "TENANT" | "LANDLORD" | "ADMIN";
}

const loginUser = async (payload: ILoginUser) => {
  const { email, password } = payload;
  if (!email || !password) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email and password are required");
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid email or password");
  }

  if (user.status === "BANNED") {
    throw new ApiError(httpStatus.FORBIDDEN, "Your account has been blocked. Please contact support.");
  }

  const isPasswordMatched = await bcrypt.compare(password, user.password);

  if (!isPasswordMatched) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid email or password");
  }

  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in
  );

  return {
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  };
};

const registerUser = async (payload: IRegisterUserPayload) => {
  return userService.registerUserIntoDB(payload);
};

export const authService = {
  loginUser,
  registerUser,
};