import { db } from "../drizzle/db";
import { eq, sql, and, desc,asc,ilike, or } from "drizzle-orm";
import { knowledgeSharing, users } from "../drizzle/schema";
import { CreatePostInput, UpdatePostInput, SearchQueryInput,RelatedPostsInput } from "../validators/validator";

//Helper functions
// Helper functions
const enrichPost = (post: any, author?: any) => ({
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
  
  const validatePostOwnership = async (postId: number, authorId: number) => {
    if (!postId || !authorId) {
        throw new Error("Both postId and authorId are required");
    }

    const post = await db
        .select()
        .from(knowledgeSharing)
        .where(eq(knowledgeSharing.id, postId))
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
  export const knowledgeService = {
    createPost: async (authorId: number, data: CreatePostInput) => {
      // Validate authorId
      if (!authorId || isNaN(authorId)) {
          throw new Error("Invalid author ID provided");
      }

      // Ensure authorId is converted to a number
      const numericAuthorId = Number(authorId);

      try {
          // Verify user exists
          const user = await db
              .select()
              .from(users)
              .where(eq(users.id, numericAuthorId))
              .execute();

          if (!user.length) {
              throw new Error("User not found");
          }

          // Create post with validated data
          const [post] = await db
              .insert(knowledgeSharing)
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

      } catch (error) {
          console.error("Post creation error:", error);
          throw new Error(error instanceof Error ? error.message : "Failed to create post");
      }
  },
  
    getPostById: async (id: number) => {
        const result = await db
          .select()
          .from(knowledgeSharing)
          .leftJoin(users, eq(knowledgeSharing.authorId, users.id))
          .where(eq(knowledgeSharing.id, id))
          .execute();
    
        if (!result.length) throw new Error("Post not found");
        return enrichPost(result[0].knowledge_sharing, result[0].users);
      },
  
      updatePost: async (id: number, authorId: number, data: UpdatePostInput) => {
        try {
            // Validate ownership and get existing post
            const existingPost = await validatePostOwnership(id, authorId);

            // Update the post
            const [updated] = await db
                .update(knowledgeSharing)
                .set({
                    title: data.title ?? existingPost.title,
                    content: data.content ?? existingPost.content,
                    category: data.category ?? existingPost.category,
                    updatedAt: new Date()
                })
                .where(eq(knowledgeSharing.id, id))
                .returning();

            // Get author information for the response
            const author = await db
                .select()
                .from(users)
                .where(eq(users.id, authorId))
                .execute();

            return enrichPost(updated, author[0]);
        } catch (error) {
            throw error instanceof Error ? error : new Error("Failed to update post");
        }
    },
  
    deletePost: async (id: number, authorId: number) => {
      await validatePostOwnership(id, authorId);
      await db
        .delete(knowledgeSharing)
        .where(eq(knowledgeSharing.id, id));
      return true;
    },
  
    searchPosts: async (params: SearchQueryInput) => {
        const { query, category, authorId, page, limit, sortBy } = params;
        const offset = (page - 1) * limit;
    
        // Build conditions
        const conditions = [];
    
        if (query) {
          conditions.push(
            or(
              ilike(knowledgeSharing.title, `%${query}%`),
              ilike(knowledgeSharing.content, `%${query}%`)
            )
          );
        }
    
        if (category) {
          conditions.push(eq(knowledgeSharing.category, category));
        }
    
        if (authorId) {
          conditions.push(eq(knowledgeSharing.authorId, authorId));
        }
    
        // Build order by condition
        const orderByClause = 
          sortBy === "newest" ? desc(knowledgeSharing.createdAt) :
          sortBy === "oldest" ? asc(knowledgeSharing.createdAt) :
          desc(sql`EXTRACT(EPOCH FROM NOW() - ${knowledgeSharing.createdAt})`);
    
        // Execute complete query in one chain
        const results = await db
          .select()
          .from(knowledgeSharing)
          .leftJoin(users, eq(knowledgeSharing.authorId, users.id))
          .$dynamic()
          .where(conditions.length ? and(...conditions) : undefined)
          .orderBy(orderByClause)
          .limit(limit)
          .offset(offset)
          .execute();
    
        return results.map(row => enrichPost(row.knowledge_sharing, row.users));
      },
    
      getRelatedPosts: async (postId: number, params: RelatedPostsInput) => {
        const currentPost = await knowledgeService.getPostById(postId);
    
        const results = await db
          .select()
          .from(knowledgeSharing)
          .leftJoin(users, eq(knowledgeSharing.authorId, users.id))
          .where(
            and(
              eq(knowledgeSharing.category, params.category || currentPost.category),
              params.excludeCurrent ? sql`${knowledgeSharing.id} != ${postId}` : undefined
            )
          )
          .orderBy(desc(knowledgeSharing.createdAt))
          .limit(params.limit)
          .execute();
    
        return results.map(row => enrichPost(row.knowledge_sharing, row.users));
      },
  
    
  
    getPopularCategories: async (limit = 5) => {
      return await db
        .select({
          category: knowledgeSharing.category,
          count: sql<number>`COUNT(*)`,
        })
        .from(knowledgeSharing)
        .groupBy(knowledgeSharing.category)
        .orderBy(desc(sql`COUNT(*)`))
        .limit(limit)
        .execute();
    },
 
  };
