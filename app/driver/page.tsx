import prisma from "@/lib/prisma";
import DriverClient from "./DriverClient";

// This forces Next.js to always fetch fresh data, never caching this page!
export const dynamic = "force-dynamic";

export default async function DriverPage() {
  // 1. Check if the driver is currently on a job
  const activeJob = await prisma.order.findFirst({
    where: { status: "EN_ROUTE" },
    include: { pub: true, catalogItem: true },
  });

  // 2. If not, find all the pubs currently looking for ice
  const pendingJobs = await prisma.order.findMany({
    where: { status: "SEARCHING" },
    include: { pub: true, catalogItem: true },
  });

  return (
    <DriverClient 
      initialActiveJob={activeJob} 
      initialPendingJobs={pendingJobs} 
    />
  );
}