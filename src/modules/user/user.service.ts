import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import config from "../../config/index";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { RegisteredUserPayload } from "./user.interface";

const registerUserIntoDB = async (payload: RegisteredUserPayload) => {
  const { name, email, password, phone, role } = payload;

  if (!name || !email || !password) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Name, email, and password are required");
  }

  const validRoles = ["TENANT", "LANDLORD", "ADMIN"];
  const userRole = role ? (role.toUpperCase() as "TENANT" | "LANDLORD" | "ADMIN") : "TENANT";

  if (role && !validRoles.includes(userRole)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Invalid role: ${role}. Valid roles are TENANT, LANDLORD, ADMIN`);
  }

  const isUserExist = await prisma.user.findUnique({
    where: { email },
  });

  if (isUserExist) {
    throw new ApiError(httpStatus.CONFLICT, "User with this email already exists");
  }

  const saltRounds = Number(config.bcrypt_salt_rounds) || 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const createdUser = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      password: hashedPassword,
      role: userRole,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return createdUser;
};

export const userService = {
  registerUserIntoDB,
};