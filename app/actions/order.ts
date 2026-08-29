"use server";
import { prisma } from "@/lib/prisma";

export async function dispatchIceVan(
  itemId: string, 
  quantity: number, 
  price: number, // The frontend passes the total calculated price here
  pubName: string,
  pubAddress: string,
  contactName: string,
  mobileNumber: string
) {
  try {
    const formattedAddress = `${pubAddress} | Contact: ${contactName} | Tel: ${mobileNumber}`;

    // 1. Find or create the Pub
    let pub = await prisma.pub.findFirst({
      where: { businessName: pubName }
    });

    if (!pub) {
      pub = await prisma.pub.create({
        data: {
          businessName: pubName,
          address: formattedAddress,
        }
      });
    } else {
      // Update pub address & contact details if already exists
      pub = await prisma.pub.update({
        where: { id: pub.id },
        data: { address: formattedAddress }
      });
    }

    // 2. THE FIX: Pass the price into the required 'totalAmount' column!
    const order = await prisma.order.create({
      data: {
        quantity,
        totalAmount: price, // <-- This is the missing piece!
        status: "SEARCHING",
        pubId: pub.id,
        catalogItemId: itemId,
      }
    });

    return { success: true, orderId: order.id };
  } catch (error: any) {
    console.error("CRITICAL DB ERROR:", error.message);
    return { success: false, error: error.message || "Unknown database error" };
  }
}

export async function checkOrderStatus(orderId: string) {
  try {
    const order = await prisma.order.findUnique({ 
      where: { id: orderId } 
    });
    return order;
  } catch (error) {
    console.error("Failed to check order status:", error);
    return null;
  }
}