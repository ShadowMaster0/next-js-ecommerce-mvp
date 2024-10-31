"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Input } from "@/components/ui/input";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import { useState } from "react";

export default function MyOrdersPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <OrdersForm />
    </Suspense>
  );
}

// Add the handleFormSubmit function
function OrdersForm() {
  const [data, setData] = useState({ error: null, message: null });
  
  async function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = (event.target as HTMLFormElement).email.value;
    const response = await fetch('/api/emailOrderHistory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const result = await response.json();
    setData(result);
  }

  return (
    <form onSubmit={handleFormSubmit} className="max-2-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>My Orders</CardTitle>
          <CardDescription>
            Enter your email to receive your order history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input type="email" required name="email" id="email" />
          {data.error && <p className="text-destructive">{data.error}</p>}
        </CardContent>
        <CardFooter>
          {data.message ? <p>{data.message}</p> : <SubmitButton />}
        </CardFooter>
      </Card>
    </form>
  );
}


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit">
      {pending ? "Sending..." : "Send"}
    </Button>
  );
}
