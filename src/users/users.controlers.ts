import { Context } from "hono";
import { listUserService, getUserService,updateUserService, deleteUserService } from "./users.service";

/**
 * List all users.
 */
export const listUsersController = async (c: Context) => {
    try {
        // Get the 'limit' query parameter and convert it to a number
        const limit = c.req.query("limit") ? Number(c.req.query("limit")) : undefined;

        // Fetch users
        const users = await listUserService(limit);

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
    } catch (error: any) {
        console.error("List Users Controller Error:", error);
        return c.json({ success: false, message: "Internal server error" }, 500);
    }
};


export const getUserController = async (c: Context) => {
    try {
        // Extract and validate user ID from params
        const userId = Number(c.req.param("id"));
        if (isNaN(userId) || userId <= 0) {
            return c.json({ success: false, message: "Invalid user ID" }, 400);
        }

        // Fetch user
        const user = await getUserService(userId);
        if (!user) {
            return c.json({ success: false, message: "User not found" }, 404);
        }

        return c.json({
            success: true,
            message: "User fetched successfully",
            data: user,
        });
    } catch (error: any) {
        console.error("Get User Controller Error:", error);
        return c.json({ success: false, message: "Internal server error" }, 500);
    }
};

export const updateUserController = async (c: Context) => {
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
        const updatedUser = await updateUserService(userId, updatedData);

        if (!updatedUser) {
            return c.json({ success: false, message: "User not found" }, 404);
        }

        return c.json({
            success: true,
            message: "User updated successfully",
            data: updatedUser,
        });
    } catch (error: any) {
        console.error("Update User Controller Error:", error);
        return c.json({ success: false, message: "Internal server error" }, 500);
    }
};


export const deleteUserController = async (c: Context) => {
    try {
       const userId = Number(c.req.param("id"));
       const searchUser = await getUserService(userId);
         if(!searchUser){
              return c.json({ success: false, message: "User not found" }, 404);
         }  
         const res = await deleteUserService(userId);

         if(!res) return c.json({message: 'User not deleted'}, 404);
   
         return c.json({message: res}, 200);
    } catch (error: any) {
        console.error("Delete User Controller Error:", error);
        return c.json({ success: false, message: "Internal server error" }, 500);
        
    }
}