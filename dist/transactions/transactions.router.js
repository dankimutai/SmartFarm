"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const cors_1 = require("hono/cors");
const transactions_controller_1 = require("./transactions.controller");
const payments = new hono_1.Hono();
// Apply CORS middleware
payments.use("/*", (0, cors_1.cors)({
    origin: ["*"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
}));
// M-Pesa payment routes
payments.post("/mpesa/initiate", transactions_controller_1.paymentController.initiatePayment);
payments.post("/mpesa/callback", transactions_controller_1.paymentController.handleCallback);
payments.get("/transaction/order/:orderId", transactions_controller_1.paymentController.getTransactionsByOrderId);
payments.get("/transaction/status/:id", transactions_controller_1.paymentController.getTransactionStatus);
payments.get("/transactions", transactions_controller_1.paymentController.getAllTransactions);
payments.get("/transactions/user/:userId", transactions_controller_1.paymentController.getUserTransactions);
payments.get("/transaction/details/:id/:userId", transactions_controller_1.paymentController.getTransactionDetails);
payments.get("/transactions/stats/:userId", transactions_controller_1.paymentController.getUserTransactionStats);
exports.default = payments;
