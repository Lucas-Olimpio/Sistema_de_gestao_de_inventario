import "dotenv/config";

// Configuration options for Prisma
export const prismaConfig = {
  datasourceUrl: process.env.DATABASE_URL!,
};
