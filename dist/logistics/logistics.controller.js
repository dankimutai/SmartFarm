"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logisticsController = void 0;
const logistics_service_1 = require("./logistics.service");
exports.logisticsController = {
    getAll: async (c) => {
        try {
            const limit = c.req.query("limit")
                ? Number(c.req.query("limit"))
                : undefined;
            const logistics = await logistics_service_1.logisticsService.getAll(limit);
            return c.json({ success: true, data: logistics });
        }
        catch (error) {
            return c.json({ success: false, error: error.message }, 500);
        }
    },
    //create logistics
    create: async (c) => {
        try {
            const data = await c.req.json();
            //convert date string to date object
            if (data.estimatedDeliveryDate) {
                data.estimatedDeliveryDate = new Date(data.estimatedDeliveryDate);
            }
            const logistics = await logistics_service_1.logisticsService.create(data);
            return c.json({ success: true, data: logistics }, 201);
        }
        catch (error) {
            return c.json({ success: false, error: error.message }, 400);
        }
    },
    markDelivered: async (c) => {
        try {
            const id = Number(c.req.param("id"));
            const logistics = await logistics_service_1.logisticsService.markDelivered(id);
            return c.json({ success: true, data: logistics });
        }
        catch (error) {
            if (error.message.includes("not found")) {
                return c.json({ success: false, error: error.message }, 404);
            }
            return c.json({ success: false, error: error.message }, 400);
        }
    },
    getPendingDeliveries: async (c) => {
        try {
            console.log("Handling pending deliveries request"); // Add logging
            const page = Math.max(1, Number(c.req.query("page")) || 1);
            const limit = Math.max(1, Math.min(100, Number(c.req.query("limit")) || 10));
            const status = c.req.query("status");
            // Validate status if provided
            if (status && !["scheduled", "in_progress"].includes(status)) {
                return c.json({
                    success: false,
                    error: "Invalid status for pending deliveries",
                    validValues: ["scheduled", "in_progress"]
                }, 400);
            }
            const result = await logistics_service_1.logisticsService.getPendingDeliveries(page, limit, status);
            return c.json({
                success: true,
                data: result.data,
                pagination: {
                    total: result.total,
                    page: result.page,
                    totalPages: result.totalPages,
                    limit
                }
            });
        }
        catch (error) {
            console.error("Error in getPendingDeliveries controller:", error);
            return c.json({
                success: false,
                error: error.message || "Internal server error"
            }, 500);
        }
    },
    getById: async (c) => {
        try {
            const id = Number(c.req.param("id"));
            if (!id || isNaN(id)) {
                return c.json({
                    success: false,
                    error: "Invalid logistics ID"
                }, 400);
            }
            const logistics = await logistics_service_1.logisticsService.getById(id);
            if (!logistics) {
                return c.json({
                    success: false,
                    error: "Logistics not found"
                }, 404);
            }
            return c.json({ success: true, data: logistics });
        }
        catch (error) {
            return c.json({
                success: false,
                error: error.message || "Internal server error"
            }, 500);
        }
    },
};
