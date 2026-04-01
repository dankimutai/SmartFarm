import { db } from "../drizzle/db";
import { ratings, users, orders } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { CreateRatingInput, UpdateRatingInput } from "../validators/validator";

export const ratingService = {
    createRating: async (raterId: number, data: CreateRatingInput) => {
        try {
            // Verify order exists and belongs to the rater
            const order = await db
                .select()
                .from(orders)
                .where(eq(orders.id, data.orderId))
                .execute();

            if (!order.length) {
                throw new Error("Order not found");
            }

            // Verify the rated user exists
            const ratedUser = await db
                .select()
                .from(users)
                .where(eq(users.id, data.ratedId))
                .execute();

            if (!ratedUser.length) {
                throw new Error("Rated user not found");
            }

            // Check if rating already exists for this order
            const existingRating = await db
                .select()
                .from(ratings)
                .where(
                    and(
                        eq(ratings.orderId, data.orderId),
                        eq(ratings.raterId, raterId)
                    )
                )
                .execute();

            if (existingRating.length) {
                throw new Error("Rating already exists for this order");
            }

            // Create the rating
            const [rating] = await db
                .insert(ratings)
                .values({
                    raterId,
                    ratedId: data.ratedId,
                    orderId: data.orderId,
                    rating: data.rating,
                    comment: data.comment,
                })
                .returning();

            return rating;
        } catch (error) {
            throw error instanceof Error ? error : new Error("Failed to create rating");
        }
    },

    updateRating: async (id: number, raterId: number, data: UpdateRatingInput) => {
        // Verify rating exists and belongs to rater
        const rating = await db
            .select()
            .from(ratings)
            .where(
                and(
                    eq(ratings.id, id),
                    eq(ratings.raterId, raterId)
                )
            )
            .execute();

        if (!rating.length) {
            throw new Error("Rating not found or unauthorized");
        }

        // Update the rating
        const [updated] = await db
            .update(ratings)
            .set({
                rating: data.rating,
                comment: data.comment,
            })
            .where(eq(ratings.id, id))
            .returning();

        return updated;
    },

    deleteRating: async (id: number, raterId: number) => {
        // Verify rating exists and belongs to rater
        const rating = await db
            .select()
            .from(ratings)
            .where(
                and(
                    eq(ratings.id, id),
                    eq(ratings.raterId, raterId)
                )
            )
            .execute();

        if (!rating.length) {
            throw new Error("Rating not found or unauthorized");
        }

        await db
            .delete(ratings)
            .where(eq(ratings.id, id));

        return true;
    },

    getRatingsByUser: async (userId: number) => {
        return await db
            .select()
            .from(ratings)
            .where(eq(ratings.ratedId, userId))
            .execute();
    },

    getRatingsByOrder: async (orderId: number) => {
        return await db
            .select()
            .from(ratings)
            .where(eq(ratings.orderId, orderId))
            .execute();
    }
};
