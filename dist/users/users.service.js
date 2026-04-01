"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserService = exports.updateUserService = exports.getUserService = exports.listUserService = void 0;
const schema_1 = require("../drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../drizzle/db");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
//List all users with optional pagination.
const listUserService = async (limit) => {
    try {
        // Fetch users with optional limit
        const userList = await db_1.db
            .select()
            .from(schema_1.users)
            .limit(limit ?? 100);
        // Fetch role-specific data for farmers and buyers
        const farmersData = await db_1.db.select().from(schema_1.farmers);
        const buyersData = await db_1.db.select().from(schema_1.buyers);
        // Map user data while removing password and adding role-specific details
        return userList.map(({ password, ...user }) => {
            const farmerProfile = farmersData.find(f => f.userId === user.id);
            const buyerProfile = buyersData.find(b => b.userId === user.id);
            return {
                ...user,
                farmerProfile: farmerProfile || null,
                buyerProfile: buyerProfile || null,
            };
        });
    }
    catch (error) {
        console.error("List Users Error:", error);
        throw new Error("Failed to fetch users");
    }
};
exports.listUserService = listUserService;
const getUserService = async (id) => {
    try {
        // Validate input
        if (!id || isNaN(id) || id <= 0) {
            throw new Error("Invalid user ID");
        }
        // Fetch user data
        const user = await db_1.db.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.users.id, id),
        });
        if (!user)
            return null;
        // Remove password from response
        const { password: _, ...userData } = user;
        // Fetch role-specific details
        let profile = null;
        if (user.role === "farmer") {
            const farmerData = await db_1.db.query.farmers.findFirst({
                where: (0, drizzle_orm_1.eq)(schema_1.farmers.userId, id),
            });
            profile = farmerData
                ? {
                    location: farmerData.location?.trim() || null,
                    farmSize: farmerData.farmSize?.trim() || null,
                    primaryCrops: farmerData.primaryCrops?.trim() || null,
                }
                : null;
        }
        else if (user.role === "buyer") {
            const buyerData = await db_1.db.query.buyers.findFirst({
                where: (0, drizzle_orm_1.eq)(schema_1.buyers.userId, id),
            });
            profile = buyerData
                ? {
                    companyName: buyerData.companyName?.trim() || null,
                    businessType: buyerData.businessType?.trim() || null,
                }
                : null;
        }
        return { ...userData, profile };
    }
    catch (error) {
        console.error("Get User Service Error:", error);
        throw new Error("Failed to fetch user");
    }
};
exports.getUserService = getUserService;
/**
 * Update user details, including role-specific updates
 */
const updateUserService = async (id, updatedUserData) => {
    try {
        // Fetch existing user
        const user = await db_1.db.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.users.id, id),
        });
        if (!user) {
            throw new Error("User not found");
        }
        // Extract password separately
        const { password, ...userUpdateData } = updatedUserData;
        // Update common user fields (excluding password)
        if (Object.keys(userUpdateData).length > 0) {
            await db_1.db.update(schema_1.users).set(userUpdateData).where((0, drizzle_orm_1.eq)(schema_1.users.id, id)).execute();
        }
        // If password is provided, hash it and update separately
        if (password) {
            const hashedPassword = await bcryptjs_1.default.hash(password, 10);
            await db_1.db.update(schema_1.users).set({ password: hashedPassword }).where((0, drizzle_orm_1.eq)(schema_1.users.id, id)).execute();
        }
        // Handle role-specific updates
        if (user.role === "farmer") {
            const farmerData = {
                location: updatedUserData.location,
                farmSize: updatedUserData.farmSize,
                primaryCrops: updatedUserData.primaryCrops,
            };
            if (Object.values(farmerData).some((value) => value !== undefined)) {
                await db_1.db.update(schema_1.farmers).set(farmerData).where((0, drizzle_orm_1.eq)(schema_1.farmers.userId, id)).execute();
            }
        }
        else if (user.role === "buyer") {
            const buyerData = {
                companyName: updatedUserData.companyName,
                businessType: updatedUserData.businessType,
            };
            if (Object.values(buyerData).some((value) => value !== undefined)) {
                await db_1.db.update(schema_1.buyers).set(buyerData).where((0, drizzle_orm_1.eq)(schema_1.buyers.userId, id)).execute();
            }
        }
        // Fetch updated user data without password
        const updatedUser = await db_1.db.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.users.id, id),
            columns: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!updatedUser) {
            throw new Error("User update failed");
        }
        return updatedUser;
    }
    catch (error) {
        console.error("Update User Service Error:", error);
        throw new Error("Failed to update user");
    }
};
exports.updateUserService = updateUserService;
//Delete user by ID
const deleteUserService = async (id) => {
    await db_1.db.delete(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id)).execute();
    return "User deleted successfully";
};
exports.deleteUserService = deleteUserService;
