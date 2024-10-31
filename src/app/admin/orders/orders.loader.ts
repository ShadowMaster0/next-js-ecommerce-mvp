// src/app/admin/orders/orders.loader.ts
import db from "@/db/db";

// Fetch orders including related user and product
export async function loader() {
  const orders = await db.order.findMany({
    include: {
      user: true,
      product: true,
    },
    orderBy: { createdAt: "desc" },
  });

  console.log("Loaded orders:", orders.length);
  return orders;
}
