import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";

const getAllUsers = async () => prisma.user.findMany({
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
  orderBy: { createdAt: "desc" },
});

const updateUserStatus = async (userId: string, status: "ACTIVE" | "BANNED") => {
  if (!status || !["ACTIVE", "BANNED"].includes(status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Valid user status (ACTIVE or BANNED) is required");
  }

  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  return prisma.user.update({
    where: { id: userId },
    data: { status },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });
};

const getAllProperties = async () => prisma.property.findMany({
  include: {
    landlord: {
      select: { id: true, name: true, email: true, phone: true },
    },
    category: true,
  },
  orderBy: { createdAt: "desc" },
});

const deleteProperty = async (propertyId: string) => {
  const existingProperty = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!existingProperty) {
    throw new ApiError(httpStatus.NOT_FOUND, "Property not found");
  }

  return prisma.property.delete({ where: { id: propertyId } });
};

const getAllRentalRequests = async () => prisma.rentalRequest.findMany({
  include: {
    property: true,
    tenant: {
      select: { id: true, name: true, email: true, phone: true },
    },
    payments: true,
  },
  orderBy: { createdAt: "desc" },
});

const createCategory = async (payload: { name: string; description?: string }) => {
  if (!payload.name) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Category name is required");
  }
  return prisma.category.create({ data: payload });
};

const updateCategory = async (categoryId: string, payload: { name?: string; description?: string }) => {
  const existingCategory = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!existingCategory) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
  }

  return prisma.category.update({ where: { id: categoryId }, data: payload });
};

const deleteCategory = async (categoryId: string) => {
  const existingCategory = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!existingCategory) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
  }

  return prisma.category.delete({ where: { id: categoryId } });
};

export const adminService = {
  getAllUsers,
  updateUserStatus,
  getAllProperties,
  deleteProperty,
  getAllRentalRequests,
  createCategory,
  updateCategory,
  deleteCategory,
};
