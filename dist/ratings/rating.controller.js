"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ratingController = void 0;
const rating_service_1 = require("./rating.service");
const validator_1 = require("../validators/validator");
exports.ratingController = {
    createRating: async (c) => {
        try {
            const user = c.get("user");
            if (!user?.userId) {
                return c.json({
                    success: false,
                    error: "Authentication required"
                }, 401);
            }
            const data = await c.req.json();
            const validation = validator_1.createRatingSchema.safeParse(data);
            if (!validation.success) {
                return c.json({
                    success: false,
                    error: validation.error.flatten()
                }, 400);
            }
            const rating = await rating_service_1.ratingService.createRating(user.userId, validation.data);
            return c.json({
                success: true,
                data: rating
            });
        }
        catch (error) {
            console.error("Rating creation error:", error);
            return c.json({
                success: false,
                error: error instanceof Error ? error.message : "Failed to create rating"
            }, 500);
        }
    },
    updateRating: async (c) => {
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
            const validation = validator_1.updateRatingSchema.safeParse(data);
            if (!validation.success) {
                return c.json({
                    success: false,
                    error: validation.error.flatten()
                }, 400);
            }
            const rating = await rating_service_1.ratingService.updateRating(ratingId, user.userId, validation.data);
            return c.json({
                success: true,
                data: rating
            });
        }
        catch (error) {
            console.error("Rating update error:", error);
            return c.json({
                success: false,
                error: error instanceof Error ? error.message : "Failed to update rating"
            }, 500);
        }
    },
    getRatingsByUser: async (c) => {
        try {
            const userId = Number(c.req.param("userId"));
            const ratings = await rating_service_1.ratingService.getRatingsByUser(userId);
            return c.json({
                success: true,
                data: ratings
            });
        }
        catch (error) {
            console.error("Error fetching ratings:", error);
            return c.json({
                success: false,
                error: "Failed to fetch ratings"
            }, 500);
        }
    },
    getRatingsByOrder: async (c) => {
        try {
            const orderId = Number(c.req.param("orderId"));
            const ratings = await rating_service_1.ratingService.getRatingsByOrder(orderId);
            return c.json({
                success: true,
                data: ratings
            });
        }
        catch (error) {
            console.error("Error fetching ratings:", error);
            return c.json({
                success: false,
                error: "Failed to fetch ratings"
            }, 500);
        }
    }
};
