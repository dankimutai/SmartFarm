"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
require("dotenv/config");
const node_server_1 = require("@hono/node-server");
const cors_1 = require("hono/cors");
const logger_1 = require("hono/logger");
const auth_router_1 = require("./auth/auth.router");
const users_routers_1 = require("./users/users.routers");
const farmers_router_1 = require("./farmers/farmers.router");
const buyers_router_1 = require("./buyers/buyers.router");
const products_router_1 = __importDefault(require("./products/products.router"));
const listings_router_1 = require("./listings/listings.router");
const orders_router_1 = require("./orders/orders.router");
const transactions_router_1 = __importDefault(require("./transactions/transactions.router"));
const logistics_router_1 = require("./logistics/logistics.router");
const knowledge_router_1 = require("./knowledge-sharing/knowledge.router");
const rating_router_1 = require("./ratings/rating.router");
const app = new hono_1.Hono();
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'https://smartfarm-sys-b89d3c.netlify.app',
    'https://reliable-jelly-003a81.netlify.app',
    'https://smartfarm-production-87da.up.railway.app'
];
// Add middleware
app.use('*', (0, cors_1.cors)({
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
app.use("*", (0, logger_1.logger)());
app.get("/", async (c) => {
    return c.json({ message: "Welcome to my API" });
});
app.route("/", auth_router_1.authRouter);
app.route("/", users_routers_1.usersRouter);
app.route("/", farmers_router_1.farmerRouter);
app.route("/", buyers_router_1.buyerRouter);
app.route("/", products_router_1.default);
app.route("/", listings_router_1.listingsRouter);
app.route("/", orders_router_1.orderRouter);
app.route("/", transactions_router_1.default);
app.route("/", logistics_router_1.logisticsRouter);
app.route("/", knowledge_router_1.knowledgeRouter);
app.route('/', rating_router_1.ratingRouter);
(0, node_server_1.serve)({
    fetch: app.fetch,
    port: Number(process.env.PORT),
});
console.log(`Server running on port ${process.env.PORT}`);
