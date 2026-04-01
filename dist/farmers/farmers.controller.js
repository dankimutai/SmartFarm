"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FarmersController = void 0;
const farmers_service_1 = require("./farmers.service");
exports.FarmersController = {
    async getAllFarmers(c) {
        const farmers = await farmers_service_1.FarmersService.getAllFarmers();
        return c.json(farmers);
    },
    //get farmers by farmer id
    async getFarmerById(c) {
        try {
            const farmerId = parseInt(c.req.param("id"));
            if (isNaN(farmerId) || farmerId <= 0) {
                return c.json({ success: false, error: "Invalid farmer ID" }, 400);
            }
            const farmer = await farmers_service_1.FarmersService.getFarmerByIdService(farmerId);
            if (!farmer) {
                return c.json({ success: false, error: "Farmer not found" }, 404);
            }
            return c.json({
                success: true,
                message: "Farmer fetched successfully",
                data: farmer,
            });
        }
        catch (error) {
            console.error("Error fetching farmer:", error);
            return c.json({ success: false, error: "Failed to fetch farmer" }, 500);
        }
    },
    //get farmer by user id
    async getFarmerByUserId(c) {
        try {
            const id = Number(c.req.param("userId"));
            if (isNaN(id)) {
                return c.json({
                    success: false,
                    error: "Invalid farmer ID",
                }, 400);
            }
            const farmer = await farmers_service_1.FarmersService.getFarmerWithUser(id);
            if (!farmer) {
                return c.json({
                    success: false,
                    error: "Farmer not found",
                }, 404);
            }
            return c.json({
                success: true,
                data: farmer,
            });
        }
        catch (error) {
            console.error("Error fetching farmer:", error);
            return c.json({
                success: false,
                error: "Failed to fetch farmer details",
            }, 500);
        }
    },
    async updateFarmerController(c) {
        try {
            //extract farmer id
            const id = parseInt(c.req.param("id"));
            if (isNaN(id)) {
                return c.json({
                    success: false,
                    error: "Invalid farmer ID",
                }, 400);
            }
            //Get vaidated data from requst body
            const updatedData = await c.req.json();
            //Convert 'farmsize to string
            if (updatedData.farmSize == undefined) {
                updatedData.farmSize = updatedData.farmSize.toString();
            }
            //Update farmer details
            const updatedFarmer = await farmers_service_1.FarmersService.updateFarmer(id, updatedData);
            if (!updatedFarmer) {
                return c.json({
                    success: false,
                    error: "Farmer not found",
                }, 404);
            }
            return c.json({
                success: true,
                message: "Farmer details updated successfully",
                data: updatedFarmer,
            });
        }
        catch (error) {
            console.error("Error updating farmer:", error);
            return c.json({
                success: false,
                error: "Failed to update farmer details",
            }, 500);
        }
    },
    async deleteFarmerController(c) {
        try {
            // Parse farmer ID from params
            const farmerId = parseInt(c.req.param("id"));
            if (isNaN(farmerId) || farmerId <= 0) {
                return c.json({ success: false, error: "Invalid farmer ID" }, 400);
            }
            // Check if farmer exists before deletion
            const existingFarmer = await farmers_service_1.FarmersService.getFarmerWithUser(farmerId);
            if (!existingFarmer) {
                return c.json({ success: false, error: "Farmer not found" }, 404);
            }
            // Delete farmer from database
            await farmers_service_1.FarmersService.deleteFarmer(farmerId);
            return c.json({
                success: true,
                message: "Farmer deleted successfully",
            });
        }
        catch (error) {
            console.error("Error deleting farmer:", error);
            return c.json({ success: false, error: "Failed to delete farmer" }, 500);
        }
    },
    async getAllFarmersLocation(c) {
        try {
            const locations = await farmers_service_1.FarmersService.getAllLocations();
            return c.json({
                success: true,
                data: locations
            });
        }
        catch (error) {
            console.error("Error fetching locations:", error);
            return c.json({
                success: false,
                error: "Failed to fetch locations"
            }, 500);
        }
    },
    async getFarmerLocationById(c) {
        try {
            const farmerId = parseInt(c.req.param("farmerId"));
            if (isNaN(farmerId)) {
                return c.json({
                    success: false,
                    error: "Invalid farmer ID"
                }, 400);
            }
            const location = await farmers_service_1.FarmersService.getLocationByFarmerId(farmerId);
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
        }
        catch (error) {
            console.error("Error fetching location:", error);
            return c.json({
                success: false,
                error: "Failed to fetch location"
            }, 500);
        }
    }
};
