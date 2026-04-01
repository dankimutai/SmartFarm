import { Hono } from "hono";
import "dotenv/config";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { ErrorHandler } from "hono";

import { authRouter } from "./auth/auth.router";
import { usersRouter } from "./users/users.routers";
import { farmerRouter } from "./farmers/farmers.router";
import { buyerRouter } from "./buyers/buyers.router";
import productRouter from "./products/products.router";
import { listingsRouter } from "./listings/listings.router";
import { orderRouter } from "./orders/orders.router";
import payments from "./transactions/transactions.router";
import { logisticsRouter } from "./logistics/logistics.router";
import { knowledgeRouter } from "./knowledge-sharing/knowledge.router";
import { ratingRouter } from "./ratings/rating.router";

const app = new Hono();
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://smartfarm-sys-b89d3c.netlify.app'
];
// Add middleware
app.use('*', cors({
  origin: (origin) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return origin;
    }
    return null;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 24 hours
}));
app.use("*", logger());

app.get("/", async (c) => {
  return c.json({ message: "Welcome to my API" });
});

app.route("/", authRouter);
app.route("/", usersRouter);
app.route("/", farmerRouter);
app.route("/", buyerRouter);
app.route("/", productRouter);
app.route("/", listingsRouter);
app.route("/", orderRouter);
app.route("/", payments);
app.route("/", logisticsRouter);
app.route("/", knowledgeRouter);
app.route('/', ratingRouter);
serve({
  fetch: app.fetch,
  port: Number(process.env.PORT),
});

console.log(`Server running on port ${process.env.PORT}`);
