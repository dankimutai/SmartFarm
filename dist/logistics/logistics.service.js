"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logisticsService = void 0;
const db_1 = require("../drizzle/db");
const schema_1 = require("../drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
exports.logisticsService = {
    //Get all logistics
    getAll: async (limit) => {
        try {
            // Basic query without relations first
            const query = db_1.db.select().from(schema_1.logistics);
            // Apply limit if provided
            if (limit) {
                query.limit(limit);
            }
            // Execute query
            const results = await query.execute();
            return results;
        }
        catch (error) {
            console.error("Error fetching all logistics:", error);
            throw new Error("Failed to fetch logistics entries");
        }
    },
    // Create new logistics entry
    create: async (data) => {
        try {
            // Check if order exists
            const order = await db_1.db
                .select()
                .from(schema_1.orders)
                .where((0, drizzle_orm_1.eq)(schema_1.orders.id, data.orderId))
                .execute();
            if (!order || order.length === 0) {
                throw new Error("Order not found");
            }
            // Check if logistics already exists for this order
            const existingLogistics = await db_1.db
                .select()
                .from(schema_1.logistics)
                .where((0, drizzle_orm_1.eq)(schema_1.logistics.orderId, data.orderId))
                .execute();
            if (existingLogistics && existingLogistics.length > 0) {
                throw new Error("Logistics already exists for this order");
            }
            // Create logistics entry
            const [logisticsResult] = await db_1.db
                .insert(schema_1.logistics)
                .values({
                orderId: data.orderId,
                pickupLocation: data.pickupLocation,
                deliveryLocation: data.deliveryLocation,
                status: "scheduled",
                estimatedDeliveryDate: data.estimatedDeliveryDate,
            })
                .returning();
            // Update order status
            await db_1.db
                .update(schema_1.orders)
                .set({ orderStatus: "confirmed" })
                .where((0, drizzle_orm_1.eq)(schema_1.orders.id, data.orderId));
            return logisticsResult;
        }
        catch (error) {
            console.error("Error creating logistics:", error);
            throw error;
        }
    },
    // Get logistics by order ID
    getByOrderId: async (orderId) => {
        try {
            const result = await db_1.db
                .select()
                .from(schema_1.logistics)
                .where((0, drizzle_orm_1.eq)(schema_1.logistics.orderId, orderId))
                .execute();
            return result[0];
        }
        catch (error) {
            console.error(`Error fetching logistics for order ${orderId}:`, error);
            throw new Error("Failed to fetch logistics");
        }
    },
    // Update logistics
    updateLogistics: async (id, updateData) => {
        try {
            const result = await db_1.db
                .update(schema_1.logistics)
                .set(updateData)
                .where((0, drizzle_orm_1.eq)(schema_1.logistics.id, id))
                .returning();
            if (!result || result.length === 0) {
                throw new Error("Logistics entry not found");
            }
            return result[0];
        }
        catch (error) {
            console.error(`Error updating logistics ${id}:`, error);
            throw new Error("Failed to update logistics");
        }
    },
    // Mark delivery as completed
    markDelivered: async (id) => {
        try {
            // Get logistics entry
            const result = await db_1.db
                .select()
                .from(schema_1.logistics)
                .where((0, drizzle_orm_1.eq)(schema_1.logistics.id, id))
                .execute();
            if (!result || result.length === 0) {
                throw new Error("Logistics entry not found");
            }
            const logisticsEntry = result[0];
            if (logisticsEntry.status === "completed") {
                throw new Error("Delivery is already marked as completed");
            }
            const deliveryTime = new Date();
            // Update logistics entry
            const [updated] = await db_1.db
                .update(schema_1.logistics)
                .set({
                status: "completed",
                deliveredAt: deliveryTime,
                actualDeliveryDate: deliveryTime,
            })
                .where((0, drizzle_orm_1.eq)(schema_1.logistics.id, id))
                .returning();
            // Update order status
            await db_1.db
                .update(schema_1.orders)
                .set({ orderStatus: "delivered" })
                .where((0, drizzle_orm_1.eq)(schema_1.orders.id, logisticsEntry.orderId));
            return updated;
        }
        catch (error) {
            console.error(`Error marking delivery ${id} as completed:`, error);
            throw error;
        }
    },
    // Get pending deliveries
    getPendingDeliveries: async (page = 1, limit = 10, status) => {
        try {
            const offset = (page - 1) * limit;
            // Create base query for pending deliveries
            const query = db_1.db.select().from(schema_1.logistics);
            // Add status filter
            if (status) {
                query.where((0, drizzle_orm_1.eq)(schema_1.logistics.status, status));
            }
            else {
                // If no specific status provided, get both scheduled and in_progress
                query.where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.logistics.status, "scheduled"), (0, drizzle_orm_1.eq)(schema_1.logistics.status, "in_progress")));
            }
            // Get total count
            const totalResults = await query.execute();
            // Get paginated data
            const data = await query
                .limit(limit)
                .offset(offset)
                .execute();
            return {
                data,
                total: totalResults.length,
                page,
                totalPages: Math.ceil(totalResults.length / limit),
            };
        }
        catch (error) {
            console.error("Error in getPendingDeliveries service:", error);
            throw new Error(`Failed to fetch pending deliveries: ${error.message}`);
        }
    },
    // Get by ID query
    getById: async (id) => {
        try {
            // Ensure id is a valid number
            if (!id || isNaN(id)) {
                throw new Error("Invalid logistics ID");
            }
            const results = await db_1.db
                .select()
                .from(schema_1.logistics)
                .where((0, drizzle_orm_1.eq)(schema_1.logistics.id, id))
                .execute();
            return results[0] || null;
        }
        catch (error) {
            console.error(`Error fetching logistics ${id}:`, error);
            throw new Error("Failed to fetch logistics");
        }
    },
};
