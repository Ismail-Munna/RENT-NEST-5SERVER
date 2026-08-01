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

// Vercel serverless handler — wraps Express app
const handler = async (req: any, res: any) => {
  await connectPrisma();
  return app(req, res);
};

export default handler;
