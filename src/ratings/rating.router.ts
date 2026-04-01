import { Hono } from "hono";
import { ratingController } from "./rating.controller";
import { allRolesAuth } from "../middleware/auth.middleware";

export const ratingRouter = new Hono();

ratingRouter.post("/ratings", allRolesAuth, ratingController.createRating);
ratingRouter.put("/ratings/:id", allRolesAuth, ratingController.updateRating);
ratingRouter.get("/ratings/user/:userId", ratingController.getRatingsByUser);
ratingRouter.get("/ratings/order/:orderId", ratingController.getRatingsByOrder);
