import OrderClient from "./OrderClient";
import prisma from "@/lib/prisma";
export default async function OrderPage() {
  // 1. Check if the database has our London inventory
  const itemCount = await prisma.catalogItem.count();
  
  // 2. If it's empty, automatically seed the real-world products!
  if (itemCount === 0) {
    await prisma.catalogItem.createMany({
      data: [
        {
          name: "Classic Ice Cubes (12kg Bulk Bag)",
          icon: "🧊",
          price: 15.00, // Typical express delivery price
        },
        {
          name: "Crushed Cocktail Ice (12kg Bulk Bag)",
          icon: "❄️",
          price: 16.00,
        },
        {
          name: "Diamond Craft Cubes 5cm (Box of 100)",
          icon: "💎",
          price: 45.00,
        },
        {
          name: "Bar Chipping Block (50x50x20cm)",
          icon: "⛏️",
          price: 85.00,
        }
      ]
    });
    
    // Ensure we have a realistic Central London Pub to deliver to
    const pubExists = await prisma.pub.findFirst();
    if (!pubExists) {
      await prisma.pub.create({
        data: {
          businessName: "The Royal Oak (Soho)",
          address: "73 Bateman St, London W1D 3AQ", 
        }
      });
    }
  }

  // 3. Fetch the inventory and pass it to the Client Component
  const catalogItems = await prisma.catalogItem.findMany();
  
  return <OrderClient items={catalogItems} />;
}