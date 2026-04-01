"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.knowledgeService = void 0;
const db_1 = require("../drizzle/db");
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../drizzle/schema");
//Helper functions
// Helper functions
const enrichPost = (post, author) => ({
    ...post,
    author: author ? {
        id: author.id,
        name: author.name,
        image: author.image,
        role: author.role
    } : null,
    metadata: {
        readingTime: Math.ceil(post.content.split(/\s+/).length / 200),
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
    }
});
const validatePostOwnership = async (postId, authorId) => {
    if (!postId || !authorId) {
        throw new Error("Both postId and authorId are required");
    }
    const post = await db_1.db
        .select()
        .from(schema_1.knowledgeSharing)
        .where((0, drizzle_orm_1.eq)(schema_1.knowledgeSharing.id, postId))
        .execute();
    if (!post.length) {
        throw new Error("Post not found");
    }
    if (post[0].authorId !== authorId) {
        throw new Error("Unauthorized: You don't have permission to update this post");
    }
    return post[0];
};
//Services
exports.knowledgeService = {
    createPost: async (authorId, data) => {
        // Validate authorId
        if (!authorId || isNaN(authorId)) {
            throw new Error("Invalid author ID provided");
        }
        // Ensure authorId is converted to a number
        const numericAuthorId = Number(authorId);
        try {
            // Verify user exists
            const user = await db_1.db
                .select()
                .from(schema_1.users)
                .where((0, drizzle_orm_1.eq)(schema_1.users.id, numericAuthorId))
                .execute();
            if (!user.length) {
                throw new Error("User not found");
            }
            // Create post with validated data
            const [post] = await db_1.db
                .insert(schema_1.knowledgeSharing)
                .values({
                title: data.title,
                content: data.content,
                category: data.category,
                authorId: numericAuthorId,
                createdAt: new Date(),
                updatedAt: new Date()
            })
                .returning();
            return enrichPost(post, user[0]);
        }
        catch (error) {
            console.error("Post creation error:", error);
            throw new Error(error instanceof Error ? error.message : "Failed to create post");
        }
    },
    getPostById: async (id) => {
        const result = await db_1.db
            .select()
            .from(schema_1.knowledgeSharing)
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.knowledgeSharing.authorId, schema_1.users.id))
            .where((0, drizzle_orm_1.eq)(schema_1.knowledgeSharing.id, id))
            .execute();
        if (!result.length)
            throw new Error("Post not found");
        return enrichPost(result[0].knowledge_sharing, result[0].users);
    },
    updatePost: async (id, authorId, data) => {
        try {
            // Validate ownership and get existing post
            const existingPost = await validatePostOwnership(id, authorId);
            // Update the post
            const [updated] = await db_1.db
                .update(schema_1.knowledgeSharing)
                .set({
                title: data.title ?? existingPost.title,
                content: data.content ?? existingPost.content,
                category: data.category ?? existingPost.category,
                updatedAt: new Date()
            })
                .where((0, drizzle_orm_1.eq)(schema_1.knowledgeSharing.id, id))
                .returning();
            // Get author information for the response
            const author = await db_1.db
                .select()
                .from(schema_1.users)
                .where((0, drizzle_orm_1.eq)(schema_1.users.id, authorId))
                .execute();
            return enrichPost(updated, author[0]);
        }
        catch (error) {
            throw error instanceof Error ? error : new Error("Failed to update post");
        }
    },
    deletePost: async (id, authorId) => {
        await validatePostOwnership(id, authorId);
        await db_1.db
            .delete(schema_1.knowledgeSharing)
            .where((0, drizzle_orm_1.eq)(schema_1.knowledgeSharing.id, id));
        return true;
    },
    searchPosts: async (params) => {
        const { query, category, authorId, page, limit, sortBy } = params;
        const offset = (page - 1) * limit;
        // Build conditions
        const conditions = [];
        if (query) {
            conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(schema_1.knowledgeSharing.title, `%${query}%`), (0, drizzle_orm_1.ilike)(schema_1.knowledgeSharing.content, `%${query}%`)));
        }
        if (category) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.knowledgeSharing.category, category));
        }
        if (authorId) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.knowledgeSharing.authorId, authorId));
        }
        // Build order by condition
        const orderByClause = sortBy === "newest" ? (0, drizzle_orm_1.desc)(schema_1.knowledgeSharing.createdAt) :
            sortBy === "oldest" ? (0, drizzle_orm_1.asc)(schema_1.knowledgeSharing.createdAt) :
                (0, drizzle_orm_1.desc)((0, drizzle_orm_1.sql) `EXTRACT(EPOCH FROM NOW() - ${schema_1.knowledgeSharing.createdAt})`);
        // Execute complete query in one chain
        const results = await db_1.db
            .select()
            .from(schema_1.knowledgeSharing)
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.knowledgeSharing.authorId, schema_1.users.id))
            .$dynamic()
            .where(conditions.length ? (0, drizzle_orm_1.and)(...conditions) : undefined)
            .orderBy(orderByClause)
            .limit(limit)
            .offset(offset)
            .execute();
        return results.map(row => enrichPost(row.knowledge_sharing, row.users));
    },
    getRelatedPosts: async (postId, params) => {
        const currentPost = await exports.knowledgeService.getPostById(postId);
        const results = await db_1.db
            .select()
            .from(schema_1.knowledgeSharing)
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.knowledgeSharing.authorId, schema_1.users.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.knowledgeSharing.category, params.category || currentPost.category), params.excludeCurrent ? (0, drizzle_orm_1.sql) `${schema_1.knowledgeSharing.id} != ${postId}` : undefined))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.knowledgeSharing.createdAt))
            .limit(params.limit)
            .execute();
        return results.map(row => enrichPost(row.knowledge_sharing, row.users));
    },
    getPopularCategories: async (limit = 5) => {
        return await db_1.db
            .select({
            category: schema_1.knowledgeSharing.category,
            count: (0, drizzle_orm_1.sql) `COUNT(*)`,
        })
            .from(schema_1.knowledgeSharing)
            .groupBy(schema_1.knowledgeSharing.category)
            .orderBy((0, drizzle_orm_1.desc)((0, drizzle_orm_1.sql) `COUNT(*)`))
            .limit(limit)
            .execute();
    },
};
