import { Hono } from "hono";
import { logisticsController } from "./logistics.controller";

export const logisticsRouter = new Hono();

logisticsRouter.get("/logistics/pending", logisticsController.getPendingDeliveries);
logisticsRouter.get("/logistics", logisticsController.getAll);
logisticsRouter.post("/logistics", logisticsController.create);
logisticsRouter.post("/logistics/:id/delivered", logisticsController.markDelivered);
logisticsRouter.get("/logistics/:id", logisticsController.getById);