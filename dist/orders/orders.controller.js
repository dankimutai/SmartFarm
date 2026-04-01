"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderController = void 0;
const orders_service_1 = require("./orders.service");
const validator_1 = require("../validators/validator");
exports.orderController = {
    //get al orders
    getAllOrders: async (c) => {
        try {
            const limit = c.req.query("limit")
                ? parseInt(c.req.query("limit"))
                : undefined;
            const orders = await orders_service_1.orderService.getAll(limit);
            return c.json(orders);
        }
        catch (error) {
            return c.json({ error: "Failed to fetch orders" }, 500);
        }
    },
    //create order
    createOrder: async (c) => {
        try {
            const validateData = await validator_1.createOrderSchema.parseAsync(await c.req.json());
            const order = await orders_service_1.orderService.create(validateData);
            return c.json({
                success: true,
                data: order,
            }, 201);
        }
        catch (error) {
            console.error("Error creating order:", error);
            return c.json({
                success: false,
                error: error.message || "Failed to create order",
            }, 400);
        }
    },
    getOrderById: async (c) => {
        try {
            const id = parseInt(c.req.param("id"));
            const order = await orders_service_1.orderService.getOrderById(id);
            if (!order) {
                return c.json({
                    success: false,
                    error: "Order not found",
                });
            }
            return c.json(order);
        }
        catch (error) {
            console.error("Error getting order:", error);
            return c.json({ error: "Failed to fetch order" }, 500);
        }
    },
    getUserOrders: async (c) => {
        try {
            // Assuming you have authentication middleware that sets user ID
            const userId = c.req.param("userId");
            if (!userId)
                return c.json({ error: "Unauthorized" }, 401);
            // Convert the string userId to a number before passing to the service
            const userIdNum = parseInt(userId, 10);
            // Check if the conversion resulted in a valid number
            if (isNaN(userIdNum)) {
                return c.json({ error: "Invalid user ID" }, 400);
            }
            const orders = await orders_service_1.orderService.getByUserId(userIdNum);
            return c.json(orders);
        }
        catch (error) {
            return c.json({ error: error.message || "Failed to fetch user orders" }, 500);
        }
    },
    //update orders
    updateOrder: async (c) => {
        try {
            const id = parseInt(c.req.param("id"));
            if (isNaN(id))
                return c.json({ error: "Invalid order ID" }, 400);
            const updateData = await c.req.json();
            const validUpdateData = {
                // Only allow certain fields to be updated
                orderStatus: updateData.orderStatus,
                paymentStatus: updateData.paymentStatus
            };
            const updatedOrder = await orders_service_1.orderService.updateOrder(id, validUpdateData);
            return c.json(updatedOrder);
        }
        catch (error) {
            return c.json({ error: error.message || "Failed to update order" }, 400);
        }
    },
    cancelOrder: async (c) => {
        try {
            const id = parseInt(c.req.param("id"));
            // Validate ID
            if (isNaN(id)) {
                return c.json({ success: false, error: "Invalid order ID" }, 400);
            }
            // Execute cancellation
            const cancelledOrder = await orders_service_1.orderService.cancelOrder(id);
            return c.json({
                success: true,
                message: "Order cancelled successfully",
                data: cancelledOrder
            });
        }
        catch (error) {
            console.error("Cancellation error:", error);
            // Handle specific error cases
            const statusCode = error.message.includes("not found") ? 404 : 400;
            return c.json({
                success: false,
                error: error.message || "Failed to cancel order"
            }, statusCode);
        }
    },
    //farmers orders
    getFarmerOrders: async (c) => {
        try {
            const userId = Number(c.req.param('farmerId')); // Assuming middleware sets this
            if (!userId || isNaN(userId)) {
                return c.json({
                    success: false,
                    message: 'User ID is required',
                    data: null
                }, 400);
            }
            const orders = await orders_service_1.orderService.getFarmerOrders(userId);
            return c.json({
                success: true,
                message: 'Orders fetched successfully',
                data: orders
            });
        }
        catch (error) {
            console.error('Error in getOrders controller:', error);
            return c.json({
                success: false,
                message: error.message || 'Failed to fetch orders',
                data: null
            }, error.message.includes('not found') ? 404 : 500);
        }
    },
};
