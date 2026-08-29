"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function acceptOrder(orderId: string) {
  try {
    let supplier = await prisma.supplier.findFirst({ where: { name: "Fast Ice Co." } });
    if (!supplier) {
      supplier = await prisma.supplier.create({
        data: { name: "Fast Ice Co.", subdomain: "fastice" }
      });
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "EN_ROUTE",
        supplierId: supplier.id,
        acceptedAt: new Date(), 
      },
    });

    revalidatePath("/driver");
    return { success: true };
  } catch (error) {
    console.error("Failed to accept order:", error);
    throw new Error("Could not accept order.");
  }
}

export async function updateVanLocation(orderId: string, lat: number, lng: number) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { vanLat: lat, vanLng: lng },
    });
  } catch (error) {
    console.error("Failed to update location", error);
  }
}

export async function markOrderDelivered(orderId: string) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "DELIVERED" },
    });
  } catch (error) {
    console.error("Failed to mark delivered:", error);
    throw new Error("Could not update order status.");
  }
}