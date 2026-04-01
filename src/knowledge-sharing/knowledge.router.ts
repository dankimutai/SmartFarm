import { Hono } from "hono";
import { knowledgeController } from "./knowledge.controller";
import { allRolesAuth } from "../middleware/auth.middleware";

export const knowledgeRouter = new Hono();

knowledgeRouter.post("/posts", allRolesAuth, knowledgeController.createPost);
knowledgeRouter.get("/posts", knowledgeController.searchPosts);
knowledgeRouter.get('/posts/categories', knowledgeController.getPopularCategories);
knowledgeRouter.get('/posts/:id/related', knowledgeController.getRelatedPosts);
knowledgeRouter.get("/posts/:id", knowledgeController.getPost);
knowledgeRouter.put("/posts/:id",allRolesAuth, knowledgeController.updatePost);
