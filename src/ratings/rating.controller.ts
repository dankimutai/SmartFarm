import { Context } from "hono";
import { ratingService } from "./rating.service";
import { createRatingSchema, updateRatingSchema } from "../validators/validator";

export const ratingController = {
    createRating: async (c: Context) => {
        try {
            const user = c.get("user");
            if (!user?.userId) {
                return c.json({ 
                    success: false, 
                    error: "Authentication required" 
                }, 401);
            }

            const data = await c.req.json();
            const validation = createRatingSchema.safeParse(data);
            
            if (!validation.success) {
                return c.json({ 
                    success: false, 
                    error: validation.error.flatten() 
                }, 400);
            }

            const rating = await ratingService.createRating(user.userId, validation.data);

            return c.json({
                success: true,
                data: rating
            });

        } catch (error) {
            console.error("Rating creation error:", error);
            return c.json({ 
                success: false, 
                error: error instanceof Error ? error.message : "Failed to create rating" 
            }, 500);
        }
    },

    updateRating: async (c: Context) => {
        try {
            const user = c.get("user");
            const ratingId = Number(c.req.param("id"));
            
            if (!user?.userId) {
                return c.json({ 
                    success: false, 
                    error: "Authentication required" 
                }, 401);
            }

            const data = await c.req.json();
            const validation = updateRatingSchema.safeParse(data);
            
            if (!validation.success) {
                return c.json({ 
                    success: false, 
                    error: validation.error.flatten() 
                }, 400);
            }

            const rating = await ratingService.updateRating(ratingId, user.userId, validation.data);

            return c.json({
                success: true,
                data: rating
            });

        } catch (error) {
            console.error("Rating update error:", error);
            return c.json({ 
                success: false, 
                error: error instanceof Error ? error.message : "Failed to update rating" 
            }, 500);
        }
    },

    getRatingsByUser: async (c: Context) => {
        try {
            const userId = Number(c.req.param("userId"));
            const ratings = await ratingService.getRatingsByUser(userId);

            return c.json({
                success: true,
                data: ratings
            });

        } catch (error) {
            console.error("Error fetching ratings:", error);
            return c.json({ 
                success: false, 
                error: "Failed to fetch ratings" 
            }, 500);
        }
    },

    getRatingsByOrder: async (c: Context) => {
        try {
            const orderId = Number(c.req.param("orderId"));
            const ratings = await ratingService.getRatingsByOrder(orderId);

            return c.json({
                success: true,
                data: ratings
            });

        } catch (error) {
            console.error("Error fetching ratings:", error);
            return c.json({ 
                success: false, 
                error: "Failed to fetch ratings" 
            }, 500);
        }
    }
};