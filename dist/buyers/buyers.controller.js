"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buyerController = void 0;
const buyers_service_1 = require("./buyers.service");
exports.buyerController = {
    getAll: async (c) => {
        try {
            // Get optional limit from query params
            const limit = c.req.query("limit")
                ? Number(c.req.query("limit"))
                : undefined;
            // Fetch buyers with optional limit
            const buyers = await buyers_service_1.buyersService.getAll(limit);
            // Return structured response
            return c.json({
                success: true,
                message: "Buyers fetched successfully",
                data: buyers,
            });
        }
        catch (error) {
            console.error("Error fetching buyers:", error);
            return c.json({ success: false, error: "Failed to fetch buyers" }, 500);
        }
    },
    //Get by ID
    async getById(c) {
        try {
            const id = Number(c.req.param("id"));
            if (isNaN(id))
                return c.json({ success: false, error: "Invalid ID" }, 400);
            const buyer = await buyers_service_1.buyersService.getById(id);
            if (!buyer)
                return c.json({ success: false, error: "Buyer not found" }, 404);
            return c.json({
                success: true,
                message: "Buyer fetched successfully",
                data: formatBuyerResponse(buyer),
            });
        }
        catch (error) {
            return c.json({ success: false, error: "Failed to fetch buyer" }, 500);
        }
    },
    //update a buyer
    async update(c) {
        try {
            const id = Number(c.req.param("id"));
            if (isNaN(id))
                return c.json({ success: false, error: "Invalid ID" }, 400);
            const data = await c.req.json();
            const updatedBuyer = await buyers_service_1.buyersService.updateBuyer(id, data);
            if (!updatedBuyer)
                return c.json({ success: false, error: "Buyer not found" }, 404);
            return c.json({
                success: true,
                message: "Buyer updated successfully",
                data: formatBuyerResponse(updatedBuyer),
            });
        }
        catch (error) {
            console.error("Error updating buyer:", error);
            return c.json({ success: false, error: "Failed to update buyer" }, 500);
        }
    },
    delete: async (c) => {
        try {
            const id = parseInt(c.req.param("id"));
            if (isNaN(id))
                return c.json({ success: false, error: "Invalid ID" }, 400);
            const buyer = await buyers_service_1.buyersService.getById(id);
            if (!buyer)
                return c.json({ success: false, error: "Buyer not found" }, 404);
            const deletedBuyer = await buyers_service_1.buyersService.deleteBuyer(id);
            if (!deletedBuyer)
                return c.json({ success: false, error: "Failed to delete buyer" }, 500);
            return c.json({ success: true, message: "Buyer deleted successfully" });
        }
        catch (error) {
            console.error("Error deleting buyer:", error);
            return c.json({ success: false, error: "Failed to delete buyer" }, 500);
        }
    }
};
// ✅ Helper function to format buyer response
const formatBuyerResponse = (buyer) => ({
    id: buyer.id,
    userId: buyer.userId,
    companyName: buyer.companyName,
    businessType: buyer.businessType,
    user: {
        name: buyer.name,
        email: buyer.email,
        phoneNumber: buyer.phoneNumber,
    },
});
