"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserController = exports.updateUserController = exports.getUserController = exports.listUsersController = void 0;
const users_service_1 = require("./users.service");
/**
 * List all users.
 */
const listUsersController = async (c) => {
    try {
        // Get the 'limit' query parameter and convert it to a number
        const limit = c.req.query("limit") ? Number(c.req.query("limit")) : undefined;
        // Fetch users
        const users = await (0, users_service_1.listUserService)(limit);
        // Check if users exist
        if (!users || users.length === 0) {
            return c.json({ success: false, message: "No users found" }, 404);
        }
        // Return users list
        return c.json({
            success: true,
            message: "Users fetched successfully",
            totalUsers: users.length,
            data: users
        });
    }
    catch (error) {
        console.error("List Users Controller Error:", error);
        return c.json({ success: false, message: "Internal server error" }, 500);
    }
};
exports.listUsersController = listUsersController;
const getUserController = async (c) => {
    try {
        // Extract and validate user ID from params
        const userId = Number(c.req.param("id"));
        if (isNaN(userId) || userId <= 0) {
            return c.json({ success: false, message: "Invalid user ID" }, 400);
        }
        // Fetch user
        const user = await (0, users_service_1.getUserService)(userId);
        if (!user) {
            return c.json({ success: false, message: "User not found" }, 404);
        }
        return c.json({
            success: true,
            message: "User fetched successfully",
            data: user,
        });
    }
    catch (error) {
        console.error("Get User Controller Error:", error);
        return c.json({ success: false, message: "Internal server error" }, 500);
    }
};
exports.getUserController = getUserController;
const updateUserController = async (c) => {
    try {
        // Parse user ID from params
        const userId = Number(c.req.param("id"));
        if (isNaN(userId) || userId <= 0) {
            return c.json({ success: false, message: "Invalid user ID" }, 400);
        }
        // Get updated data from request body
        const updatedData = await c.req.json();
        if (!updatedData || Object.keys(updatedData).length === 0) {
            return c.json({ success: false, message: "No data provided for update" }, 400);
        }
        // Call service to update user
        const updatedUser = await (0, users_service_1.updateUserService)(userId, updatedData);
        if (!updatedUser) {
            return c.json({ success: false, message: "User not found" }, 404);
        }
        return c.json({
            success: true,
            message: "User updated successfully",
            data: updatedUser,
        });
    }
    catch (error) {
        console.error("Update User Controller Error:", error);
        return c.json({ success: false, message: "Internal server error" }, 500);
    }
};
exports.updateUserController = updateUserController;
const deleteUserController = async (c) => {
    try {
        const userId = Number(c.req.param("id"));
        const searchUser = await (0, users_service_1.getUserService)(userId);
        if (!searchUser) {
            return c.json({ success: false, message: "User not found" }, 404);
        }
        const res = await (0, users_service_1.deleteUserService)(userId);
        if (!res)
            return c.json({ message: 'User not deleted' }, 404);
        return c.json({ message: res }, 200);
    }
    catch (error) {
        console.error("Delete User Controller Error:", error);
        return c.json({ success: false, message: "Internal server error" }, 500);
    }
};
exports.deleteUserController = deleteUserController;
