import "dotenv/config";
import app from "./app";
import { prisma } from "./lib/prisma";
import config from "./config/index";

const PORT = config.port;

// Only start the HTTP server when running locally (not on Vercel serverless)
if (process.env.NODE_ENV !== "production") {
  const startServer = async () => {
    try {
      await prisma.$connect();
      console.log("Connected to the database successfully");
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    } catch (error) {
      console.error("Error starting the server:", error);
      await prisma.$disconnect();
      process.exit(1);
    }
  };
  startServer();
}

export default app;