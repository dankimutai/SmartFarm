import { Hono } from "hono";
import { cors } from "hono/cors";
import { paymentController } from "./transactions.controller";

const payments = new Hono();

// Apply CORS middleware
payments.use(
  "/*",
  cors({
    origin: ["*"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  })
);

// M-Pesa payment routes
payments.post("/mpesa/initiate", paymentController.initiatePayment);
payments.post("/mpesa/callback", paymentController.handleCallback);
payments.get("/transaction/order/:orderId", paymentController.getTransactionsByOrderId);
payments.get("/transaction/status/:id", paymentController.getTransactionStatus);
payments.get("/transactions", paymentController.getAllTransactions);

payments.get("/transactions/user/:userId", paymentController.getUserTransactions);
payments.get("/transaction/details/:id/:userId", paymentController.getTransactionDetails);
payments.get("/transactions/stats/:userId", paymentController.getUserTransactionStats);


export default payments;