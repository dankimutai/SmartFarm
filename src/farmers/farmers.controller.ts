import { Context } from "hono";
import { json } from "drizzle-orm/pg-core";
import { FarmersService } from "./farmers.service";
import {
  createFarmerSchema,
  updateFarmerSchema,
} from "../validators/validator";
import { zValidator } from "@hono/zod-validator";
import { error } from "console";

export const FarmersController = {
  async getAllFarmers(c: Context) {
    const farmers = await FarmersService.getAllFarmers();
    return c.json(farmers);
  },
  //get farmers by farmer id
  async getFarmerById(c: Context) {
    try {
      const farmerId = parseInt(c.req.param("id"));
      if (isNaN(farmerId) || farmerId <= 0) {
        return c.json({ success: false, error: "Invalid farmer ID" }, 400);
      }

      const farmer = await FarmersService.getFarmerByIdService(farmerId);
      if (!farmer) {
        return c.json({ success: false, error: "Farmer not found" }, 404);
      }

      return c.json({
        success: true,
        message: "Farmer fetched successfully",
        data: farmer,
      });
    } catch (error) {
      console.error("Error fetching farmer:", error);
      return c.json({ success: false, error: "Failed to fetch farmer" }, 500);
    }
  },

  //get farmer by user id
  async getFarmerByUserId(c: Context) {
    try {
      const id = Number(c.req.param("userId"));

      if (isNaN(id)) {
        return c.json(
          {
            success: false,
            error: "Invalid farmer ID",
          },
          400
        );
      }

      const farmer = await FarmersService.getFarmerWithUser(id);

      if (!farmer) {
        return c.json(
          {
            success: false,
            error: "Farmer not found",
          },
          404
        );
      }
      return c.json({
        success: true,
        data: farmer,
      });
    } catch (error: any) {
      console.error("Error fetching farmer:", error);
      return c.json(
        {
          success: false,
          error: "Failed to fetch farmer details",
        },
        500
      );
    }
  },

  async updateFarmerController(c: Context) {
    try {
      //extract farmer id
      const id = parseInt(c.req.param("id"));
      if (isNaN(id)) {
        return c.json(
          {
            success: false,
            error: "Invalid farmer ID",
          },
          400
        );
      }

      //Get vaidated data from requst body
      const updatedData = await c.req.json();

      //Convert 'farmsize to string
      if (updatedData.farmSize! == undefined) {
        updatedData.farmSize = updatedData.farmSize.toString();
      }

      //Update farmer details
      const updatedFarmer = await FarmersService.updateFarmer(id, updatedData);
      if (!updatedFarmer) {
        return c.json(
          {
            success: false,
            error: "Farmer not found",
          },
          404
        );
      }
      return c.json({
        success: true,
        message: "Farmer details updated successfully",
        data: updatedFarmer,
      });
    } catch (error: any) {
      console.error("Error updating farmer:", error);
      return c.json(
        {
          success: false,
          error: "Failed to update farmer details",
        },
        500
      );
    }
  },

  async deleteFarmerController(c: Context) {
    try {
      // Parse farmer ID from params
      const farmerId = parseInt(c.req.param("id"));
      if (isNaN(farmerId) || farmerId <= 0) {
        return c.json({ success: false, error: "Invalid farmer ID" }, 400);
      }

      // Check if farmer exists before deletion
      const existingFarmer = await FarmersService.getFarmerWithUser(farmerId);
      if (!existingFarmer) {
        return c.json({ success: false, error: "Farmer not found" }, 404);
      }

      // Delete farmer from database
      await FarmersService.deleteFarmer(farmerId);

      return c.json({
        success: true,
        message: "Farmer deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting farmer:", error);
      return c.json({ success: false, error: "Failed to delete farmer" }, 500);
    }
  },
  async getAllFarmersLocation(c: Context) {
    try {
        const locations = await FarmersService.getAllLocations();
        return c.json({
          success: true,
          data: locations
        });
      } catch (error) {
        console.error("Error fetching locations:", error);
        return c.json({
          success: false,
          error: "Failed to fetch locations"
        }, 500);
      }
  },
  async getFarmerLocationById(c: Context) {
    try {
        const farmerId = parseInt(c.req.param("farmerId"));
        
        if (isNaN(farmerId)) {
          return c.json({
            success: false,
            error: "Invalid farmer ID"
          }, 400);
        }
    
        const location = await FarmersService.getLocationByFarmerId(farmerId);
        
        if (!location) {
          return c.json({
            success: false,
            error: "Farmer not found"
          }, 404);
        }
    
        return c.json({
          success: true,
          data: location
        });
      } catch (error) {
        console.error("Error fetching location:", error);
        return c.json({
          success: false,
          error: "Failed to fetch location"
        }, 500);
      }
  }
};
