/// <reference path="../src/types/express.d.ts" />
import "dotenv/config";
import app from "../src/app";
import { prisma } from "../src/lib/prisma";

// Lazily connect Prisma on first cold start
let isPrismaConnected = false;
const connectPrisma = async () => {
  if (isPrismaConnected) return;
  await prisma.$connect();
  isPrismaConnected = true;
};


const handler = async (req: any, res: any) => {
  try {
    await connectPrisma();
    return app(req, res);
  } catch (error: any) {
    console.error("Vercel Serverless Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Initialization Failed",
      error: error.message,
      hasDatabaseUrl: !!process.env.DATABASE_URL
    });
  }
};

export default handler;