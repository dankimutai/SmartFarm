import { Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { buyerController } from "./buyers.controller";
import { buyers } from "../drizzle/schema";

export const buyerRouter = new Hono();

buyerRouter.get('/buyers', buyerController.getAll); // Get all buyers
buyerRouter.get('/buyers/:id', buyerController.getById); // Get buyer by ID
buyerRouter.put('/buyers/:id', buyerController.update); // Update buyer by ID
buyerRouter.delete('/buyers/:id', buyerController.delete);