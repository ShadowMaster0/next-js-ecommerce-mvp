// src/pages/api/emailOrderHistory.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import db from '../../db/db';
import { Resend } from 'resend';
import { randomUUID } from 'crypto';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import OrderHistoryEmail from '../../email/OrderHistory';

const emailSchema = z.string().email();
const resend = new Resend(process.env.RESEND_API_KEY as string);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email } = req.body;

  const result = emailSchema.safeParse(email);
  if (!result.success) return res.status(400).json({ error: 'Invalid email' });

  const user = await db.user.findUnique({
    where: { email: result.data },
    select: {
      email: true,
      orders: {
        select: {
          id: true,
          priceInCents: true,
          createdAt: true,
          product: {
            select: { id: true, name: true, imagePath: true, description: true },
          },
        },
      },
    },
  });
  
  if (!user) return res.json({ message: 'No orders found' });

  const orders = user.orders.map(order => ({
    ...order,
    downloadVerificationId: randomUUID(),
  }));

  // Send the email logic
  const emailContent = ReactDOMServer.renderToStaticMarkup(<OrderHistoryEmail orders={orders} />);
  const data = await resend.emails.send({
    from: `Support <${process.env.SENDER_EMAIL}>`,
    to: user.email,
    subject: 'Your order history',
    html: emailContent,
  });

  res.json(data.error ? { error: 'Failed to send email' } : { message: 'Email sent' });
}
