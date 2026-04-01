"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderService = void 0;
const db_1 = require("../drizzle/db");
const schema_1 = require("../drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
const drizzle_orm_2 = require("drizzle-orm");
exports.orderService = {
    //get all orders with optional llimit
    getAll: async (limit) => {
        try {
            if (limit) {
                return await db_1.db.query.orders.findMany({
                    limit: limit,
                    with: {
                        buyer: true,
                        listing: {
                            with: {
                                farmer: true,
                                product: true,
                            },
                        },
                    },
                });
            }
            return await db_1.db.query.orders.findMany({
                with: {
                    buyer: true,
                    listing: {
                        with: {
                            farmer: true,
                            product: true,
                        },
                    },
                },
            });
        }
        catch (error) {
            console.error("Error fetching all orders:", error);
            throw new Error("Failed to fetch orders");
        }
    },
    create: async (data) => {
        try {
            // Check listing availability
            const listing = await db_1.db.query.listings.findFirst({
                where: (0, drizzle_orm_1.eq)(schema_1.listings.id, data.listingId),
            });
            if (!listing) {
                throw new Error("Listing not found");
            }
            // Convert strings to decimals for comparison
            const listingQuantity = parseFloat(listing.quantity);
            const orderQuantity = parseFloat(data.quantity);
            if (listingQuantity < orderQuantity) {
                throw new Error("Insufficient quantity available");
            }
            if (listing.status !== "active") {
                throw new Error("Listing is not active");
            }
            //Ensure buyerId is not null
            if (data.buyerId === null || data.buyerId === undefined) {
                throw new Error("Buyer ID is required");
            }
            // Create order with explicit type assertion
            const [orderResult] = await db_1.db
                .insert(schema_1.orders)
                .values({
                buyerId: data.buyerId,
                listingId: data.listingId,
                quantity: data.quantity,
                totalPrice: data.totalPrice,
                orderStatus: "pending",
                paymentStatus: "pending",
            })
                .returning();
            // Update listing quantity
            const newQuantity = (listingQuantity - orderQuantity).toFixed(2);
            await db_1.db
                .update(schema_1.listings)
                .set({
                quantity: newQuantity,
                status: newQuantity === "0.00" ? "sold" : "active",
                updatedAt: new Date(),
            })
                .where((0, drizzle_orm_1.eq)(schema_1.listings.id, data.listingId));
            // Assert the returned order matches the Order type
            const order = {
                id: orderResult.id,
                createdAt: orderResult.createdAt ?? new Date(),
                updatedAt: orderResult.updatedAt ?? new Date(),
                quantity: orderResult.quantity,
                buyerId: orderResult.buyerId,
                listingId: orderResult.listingId,
                totalPrice: orderResult.totalPrice,
                orderStatus: orderResult.orderStatus,
                paymentStatus: orderResult.paymentStatus,
            };
            return order;
        }
        catch (error) {
            console.error("Error creating order:", error);
            throw error;
        }
    },
    getOrderById: async (id) => {
        try {
            return await db_1.db.query.orders.findFirst({
                where: (0, drizzle_orm_1.eq)(schema_1.orders.id, id),
                with: {
                    buyer: true,
                    listing: {
                        with: {
                            farmer: true,
                            product: true,
                        },
                    },
                },
            });
        }
        catch (error) {
            console.error(`Error fetching order ${id}:`, error);
            throw new Error("Failed to fetch order");
        }
    },
    getByUserId: async (userId) => {
        try {
            // First get buyer ID from user ID
            const buyer = await db_1.db.query.buyers.findFirst({
                where: (buyers, { eq }) => eq(buyers.userId, userId),
            });
            if (!buyer) {
                throw new Error("Buyer not found for this user");
            }
            return await db_1.db.query.orders.findMany({
                where: (orders, { eq }) => eq(orders.buyerId, buyer.id),
                with: {
                    listing: {
                        with: {
                            product: true,
                            farmer: true,
                        },
                    },
                    logistics: true,
                },
                orderBy: (orders) => [orders.createdAt],
            });
        }
        catch (error) {
            console.error(`Error fetching orders for user ${userId}:`, error);
            throw new Error("Failed to fetch user orders");
        }
    },
    //update orders
    updateOrder: async (id, updateData) => {
        try {
            const [order] = await db_1.db
                .update(schema_1.orders)
                .set(updateData)
                .where((0, drizzle_orm_1.eq)(schema_1.orders.id, id))
                .returning();
            if (!order) {
                throw new Error("Order not found");
            }
            return order;
        }
        catch (error) {
            console.error(`Error updating order ${id}:`, error);
            throw new Error("Failed to update order");
        }
    },
    cancelOrder: async (id) => {
        try {
            // 1. Get the order first
            const order = await db_1.db.query.orders.findFirst({
                where: (0, drizzle_orm_1.eq)(schema_1.orders.id, id),
            });
            if (!order || !order.orderStatus) {
                throw new Error("Order not found or invalid status");
            }
            // 2. Check if order can be cancelled
            if (order.orderStatus === "cancelled") {
                throw new Error("Order is already cancelled");
            }
            if (!["pending", "confirmed"].includes(order.orderStatus)) {
                throw new Error("Order cannot be cancelled in current state");
            }
            // 3. Get associated listing
            const listing = await db_1.db.query.listings.findFirst({
                where: (0, drizzle_orm_1.eq)(schema_1.listings.id, order.listingId),
            });
            if (!listing) {
                throw new Error("Associated listing not found");
            }
            // 4. First update the quantity
            const newQuantity = (0, drizzle_orm_2.sql) `${listing.quantity}::numeric + ${order.quantity}::numeric`;
            const updatedQuantity = await db_1.db.update(schema_1.listings)
                .set({
                quantity: newQuantity,
                updatedAt: new Date()
            })
                .where((0, drizzle_orm_1.eq)(schema_1.listings.id, order.listingId))
                .returning();
            if (!updatedQuantity || updatedQuantity.length === 0) {
                throw new Error("Failed to update listing quantity");
            }
            // 5. Then update the status based on the new quantity
            // Convert string quantity to number for comparison
            const quantityValue = Number(updatedQuantity[0].quantity);
            const updatedListing = await db_1.db.update(schema_1.listings)
                .set({
                status: quantityValue > 0 ? "active" : "sold",
                updatedAt: new Date()
            })
                .where((0, drizzle_orm_1.eq)(schema_1.listings.id, order.listingId))
                .returning();
            if (!updatedListing || updatedListing.length === 0) {
                throw new Error("Failed to update listing status");
            }
            // 6. Update order status
            const updatedOrders = await db_1.db.update(schema_1.orders)
                .set({
                orderStatus: "cancelled",
                updatedAt: new Date()
            })
                .where((0, drizzle_orm_1.eq)(schema_1.orders.id, id))
                .returning();
            if (!updatedOrders || updatedOrders.length === 0) {
                // Rollback listing updates
                await db_1.db.update(schema_1.listings)
                    .set({
                    quantity: listing.quantity,
                    status: listing.status,
                    updatedAt: listing.updatedAt
                })
                    .where((0, drizzle_orm_1.eq)(schema_1.listings.id, order.listingId));
                throw new Error("Failed to update order");
            }
            return updatedOrders[0];
        }
        catch (error) {
            console.error(`Error cancelling order ${id}:`, error);
            throw error;
        }
    },
    //get orders for farmer
    getFarmerOrders: async (userId) => {
        try {
            // First get farmer ID from user ID
            const farmer = await db_1.db.query.farmers.findFirst({
                where: (farmers, { eq }) => eq(farmers.userId, userId),
            });
            if (!farmer) {
                throw new Error("Farmer not found");
            }
            // First get all listings for this farmer
            const farmerListings = await db_1.db.query.listings.findMany({
                where: (listings, { eq }) => eq(listings.farmerId, farmer.id),
                columns: {
                    id: true
                }
            });
            const listingIds = farmerListings.map(listing => listing.id);
            // Then get orders for these listings
            return await db_1.db.query.orders.findMany({
                where: (orders, { inArray }) => inArray(orders.listingId, listingIds),
                with: {
                    buyer: true,
                    listing: {
                        with: {
                            product: true,
                            farmer: true,
                        },
                    },
                },
                orderBy: (orders) => [orders.createdAt],
            });
        }
        catch (error) {
            console.error(`Error fetching orders for farmer ${userId}:`, error);
            throw new Error("Failed to fetch farmer orders");
        }
    }
};
