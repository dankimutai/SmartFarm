import { Hono } from "hono";
import { FarmersController } from "./farmers.controller";
import { updateFarmerSchema } from "../validators/validator";
import { zValidator } from "@hono/zod-validator";

export const farmerRouter = new Hono();
farmerRouter.get('/farmers/locations', FarmersController.getAllFarmersLocation);
farmerRouter.get("/farmers", FarmersController.getAllFarmers);
farmerRouter.get("/farmers/:userId", FarmersController.getFarmerByUserId);
farmerRouter.put("/farmers/:id", zValidator('json', updateFarmerSchema), FarmersController.updateFarmerController);
farmerRouter.delete("/farmers/:id", FarmersController.deleteFarmerController);

// farmerRouter.get('/farmers/locations/:farmerId', FarmersController.getFarmerLocationById);