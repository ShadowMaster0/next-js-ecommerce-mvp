// src/app/admin/orders/page.tsx

import React from 'react';
import { PageHeader } from "../_components/PageHeader";
import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { DeleteDropdownItem } from "./_components/OrderActions";
import { loader } from "./orders.loader"; // Import the loader function

interface Order {
  id: string;
  priceInCents: number;
  product: {
    name: string;
  };
  user: {
    email: string;
  };
}

const OrdersPage = async () => {
  // Fetch orders directly inside the component
  const orders: Order[] = await loader();
  console.log("Orders received:", orders);

  if (!orders || orders.length === 0) return <p>No Sales Found</p>;

  return (
    <>
      <PageHeader>Customers</PageHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-0"></TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Orders</TableHead>
            <TableHead>Value</TableHead>
            <TableHead className="w-0">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>{order.product.name}</TableCell>
              <TableCell>{order.user.email}</TableCell>
              <TableCell>{formatCurrency(order.priceInCents / 100)}</TableCell>
              <TableCell className="text-center">
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <MoreVertical />
                    <span className="sr-only">Actions</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DeleteDropdownItem id={order.id} />
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};

export default OrdersPage;
