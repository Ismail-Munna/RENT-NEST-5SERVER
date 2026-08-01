import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";

type PropertyQuery = Record<string, unknown>;

const parseStringArray = (value: unknown) => {
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => item.split(","))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const getAllProperties = async (query: PropertyQuery) => {
  const where: Record<string, unknown> = {};

  const status = typeof query.status === "string" ? query.status : "AVAILABLE";
  const location = typeof query.location === "string" ? query.location : undefined;
  const city = typeof query.city === "string" ? query.city : undefined;
  const minPrice = query.minPrice !== undefined && query.minPrice !== "" ? Number(query.minPrice) : undefined;
  const maxPrice = query.maxPrice !== undefined && query.maxPrice !== "" ? Number(query.maxPrice) : undefined;
  const category = typeof query.category === "string" ? query.category : undefined;
  const categoryId = typeof query.categoryId === "string" ? query.categoryId : undefined;
  const type = typeof query.type === "string" ? query.type : undefined;
  const searchTerm =
    typeof query.search === "string"
      ? query.search
      : typeof query.searchTerm === "string"
      ? query.searchTerm
      : undefined;
  const amenities = parseStringArray(query.amenities);

  if (status && status.toUpperCase() !== "ALL") {
    where.status = status.toUpperCase();
  }

  if (searchTerm) {
    where.OR = [
      { title: { contains: searchTerm, mode: "insensitive" } },
      { location: { contains: searchTerm, mode: "insensitive" } },
      { city: { contains: searchTerm, mode: "insensitive" } },
      { description: { contains: searchTerm, mode: "insensitive" } },
    ];
  } else {
    if (location) {
      where.location = { contains: location, mode: "insensitive" };
    }

    if (city) {
      where.city = { contains: city, mode: "insensitive" };
    }
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};

    if (minPrice !== undefined && !isNaN(minPrice)) {
      (where.price as Record<string, number>).gte = minPrice;
    }

    if (maxPrice !== undefined && !isNaN(maxPrice)) {
      (where.price as Record<string, number>).lte = maxPrice;
    }
  }

  const categoryName = category || type;
  if (categoryName) {
    where.category = { name: { contains: categoryName, mode: "insensitive" } };
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (amenities.length) {
    where.amenities = { hasSome: amenities };
  }

  return prisma.property.findMany({
    where,
    include: {
      category: true,
      landlord: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      reviews: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getPropertyById = async (propertyId: string) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      category: true,
      landlord: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!property) {
    throw new ApiError(httpStatus.NOT_FOUND, "Property not found");
  }

  return property;
};

export const propertyService = {
  getAllProperties,
  getPropertyById,
};
