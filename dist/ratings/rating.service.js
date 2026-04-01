"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ratingService = void 0;
const db_1 = require("../drizzle/db");
const schema_1 = require("../drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
exports.ratingService = {
    createRating: async (raterId, data) => {
        try {
            // Verify order exists and belongs to the rater
            const order = await db_1.db
                .select()
                .from(schema_1.orders)
                .where((0, drizzle_orm_1.eq)(schema_1.orders.id, data.orderId))
                .execute();
            if (!order.length) {
                throw new Error("Order not found");
            }
            // Verify the rated user exists
            const ratedUser = await db_1.db
                .select()
                .from(schema_1.users)
                .where((0, drizzle_orm_1.eq)(schema_1.users.id, data.ratedId))
                .execute();
            if (!ratedUser.length) {
                throw new Error("Rated user not found");
            }
            // Check if rating already exists for this order
            const existingRating = await db_1.db
                .select()
                .from(schema_1.ratings)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.ratings.orderId, data.orderId), (0, drizzle_orm_1.eq)(schema_1.ratings.raterId, raterId)))
                .execute();
            if (existingRating.length) {
                throw new Error("Rating already exists for this order");
            }
            // Create the rating
            const [rating] = await db_1.db
                .insert(schema_1.ratings)
                .values({
                raterId,
                ratedId: data.ratedId,
                orderId: data.orderId,
                rating: data.rating,
                comment: data.comment,
            })
                .returning();
            return rating;
        }
        catch (error) {
            throw error instanceof Error ? error : new Error("Failed to create rating");
        }
    },
    updateRating: async (id, raterId, data) => {
        // Verify rating exists and belongs to rater
        const rating = await db_1.db
            .select()
            .from(schema_1.ratings)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.ratings.id, id), (0, drizzle_orm_1.eq)(schema_1.ratings.raterId, raterId)))
            .execute();
        if (!rating.length) {
            throw new Error("Rating not found or unauthorized");
        }
        // Update the rating
        const [updated] = await db_1.db
            .update(schema_1.ratings)
            .set({
            rating: data.rating,
            comment: data.comment,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.ratings.id, id))
            .returning();
        return updated;
    },
    deleteRating: async (id, raterId) => {
        // Verify rating exists and belongs to rater
        const rating = await db_1.db
            .select()
            .from(schema_1.ratings)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.ratings.id, id), (0, drizzle_orm_1.eq)(schema_1.ratings.raterId, raterId)))
            .execute();
        if (!rating.length) {
            throw new Error("Rating not found or unauthorized");
        }
        await db_1.db
            .delete(schema_1.ratings)
            .where((0, drizzle_orm_1.eq)(schema_1.ratings.id, id));
        return true;
    },
    getRatingsByUser: async (userId) => {
        return await db_1.db
            .select()
            .from(schema_1.ratings)
            .where((0, drizzle_orm_1.eq)(schema_1.ratings.ratedId, userId))
            .execute();
    },
    getRatingsByOrder: async (orderId) => {
        return await db_1.db
            .select()
            .from(schema_1.ratings)
            .where((0, drizzle_orm_1.eq)(schema_1.ratings.orderId, orderId))
            .execute();
    }
};
