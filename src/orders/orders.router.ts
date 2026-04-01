import { Hono } from "hono";
import { orderController } from "./orders.controller";
import { zValidator } from "@hono/zod-validator";

export const orderRouter = new Hono();

orderRouter.get('/orders', orderController.getAllOrders);
orderRouter.get('/orders/farmer/:farmerId', orderController.getFarmerOrders);
orderRouter.post('/orders', orderController.createOrder);
orderRouter.get('/orders/:id', orderController.getOrderById);
orderRouter.get('/orders/user/:userId', orderController.getUserOrders);
orderRouter.patch('/orders/:id', orderController.updateOrder);
orderRouter.delete('/orders/:id', orderController.cancelOrder);



