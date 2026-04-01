"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.knowledgeController = void 0;
const knowledge_service_1 = require("./knowledge.service");
const validator_1 = require("../validators/validator");
const handleError = (c, error) => {
    console.error("Knowledge API Error:", error);
    switch (error.message) {
        case "Post not found":
        case "User not found":
            return c.json({ success: false, error: error.message }, 404);
        case "Unauthorized":
            return c.json({ success: false, error: error.message }, 403);
        default:
            return c.json({
                success: false,
                error: "Internal server error",
                message: error.message,
            }, 500);
    }
};
exports.knowledgeController = {
    createPost: async (c) => {
        try {
            const user = c.get("user");
            if (!user || !user.userId) {
                return c.json({
                    success: false,
                    error: "User authentication required",
                }, 401);
            }
            const data = await c.req.json();
            // Validate required fields
            if (!data.title || !data.content || !data.category) {
                return c.json({
                    success: false,
                    error: "Missing required fields",
                }, 400);
            }
            const post = await knowledge_service_1.knowledgeService.createPost(user.userId, {
                title: data.title,
                content: data.content,
                category: data.category,
            });
            return c.json({
                success: true,
                data: post,
            });
        }
        catch (error) {
            console.error("Knowledge API Error:", error);
            return c.json({
                success: false,
                error: error instanceof Error ? error.message : "Internal server error",
            }, 500);
        }
    },
    getPost: async (c) => {
        try {
            const id = Number(c.req.param("id"));
            if (isNaN(id)) {
                return c.json({ error: "Invalid post ID" }, 400);
            }
            const post = await knowledge_service_1.knowledgeService.getPostById(id);
            return c.json({ success: true, data: post });
        }
        catch (error) {
            return handleError(c, error);
        }
    },
    searchPosts: async (c) => {
        try {
            const params = {
                query: c.req.query("query"),
                category: c.req.query("category"),
                authorId: c.req.query("authorId")
                    ? Number(c.req.query("authorId"))
                    : undefined,
                page: Number(c.req.query("page")) || 1,
                limit: Number(c.req.query("limit")) || 10,
                sortBy: c.req.query("sortBy") || "newest",
            };
            const validation = validator_1.searchQuerySchema.safeParse(params);
            if (!validation.success) {
                return c.json({ error: validation.error.flatten() }, 400);
            }
            const results = await knowledge_service_1.knowledgeService.searchPosts(validation.data);
            return c.json({ success: true, data: results });
        }
        catch (error) {
            return handleError(c, error);
        }
    },
    getRelatedPosts: async (c) => {
        try {
            const id = Number(c.req.param("id"));
            const params = {
                category: c.req.query("category"),
                excludeCurrent: c.req.query("excludeCurrent") !== "false",
                limit: Number(c.req.query("limit")) || 3,
            };
            const validation = validator_1.relatedPostsSchema.safeParse(params);
            if (!validation.success) {
                return c.json({ error: validation.error.flatten() }, 400);
            }
            const results = await knowledge_service_1.knowledgeService.getRelatedPosts(id, validation.data);
            return c.json({ success: true, data: results });
        }
        catch (error) {
            return handleError(c, error);
        }
    },
    getPopularCategories: async (c) => {
        try {
            const limit = Number(c.req.query("limit")) || 5;
            const categories = await knowledge_service_1.knowledgeService.getPopularCategories(limit);
            return c.json({ success: true, data: categories });
        }
        catch (error) {
            return handleError(c, error);
        }
    },
    updatePost: async (c) => {
        try {
            const postId = Number(c.req.param("id"));
            const user = c.get("user"); // Get user from context set by auth middleware
            if (!user || !user.userId) {
                return c.json({
                    success: false,
                    error: "Authentication required",
                }, 401);
            }
            // Validate post ID
            if (!postId || isNaN(postId)) {
                return c.json({
                    success: false,
                    error: "Invalid post ID",
                }, 400);
            }
            const data = await c.req.json();
            const updatedPost = await knowledge_service_1.knowledgeService.updatePost(postId, user.userId, data);
            return c.json({
                success: true,
                data: updatedPost,
                message: "Post updated successfully",
            });
        }
        catch (error) {
            console.error("Post update error:", error);
            if (error instanceof Error) {
                if (error.message.includes("not found")) {
                    return c.json({
                        success: false,
                        error: "Post not found",
                    }, 404);
                }
                if (error.message.includes("Unauthorized")) {
                    return c.json({
                        success: false,
                        error: error.message,
                    }, 403);
                }
            }
            return c.json({
                success: false,
                error: "Failed to update post",
            }, 500);
        }
    },
};
