import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// 1. Initialize the new Prisma 7 adapter with your database URL
const adapter = new PrismaPg({ 
  connectionString: process.env.DATABASE_URL! 
});

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 2. Pass the adapter directly into the PrismaClient constructor
export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;