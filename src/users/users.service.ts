import { TSUsers,TIUsers, users, farmers, buyers } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { db } from "../drizzle/db";
import bcrypt from "bcryptjs";

// Define user type with profile data
type UserWithProfile = Omit<TSUsers, "password"> & {
    profile?: {
        location?: string | null;
        farmSize?: string | null;
        primaryCrops?: string | null;
        companyName?: string | null;
        businessType?: string | null;
    } | null;
};


 //List all users with optional pagination.

export const listUserService = async (limit?: number): Promise<Partial<TSUsers>[]> => {
    try {
        // Fetch users with optional limit
        const userList = await db
            .select()
            .from(users)
            .limit(limit ?? 100);

        // Fetch role-specific data for farmers and buyers
        const farmersData = await db.select().from(farmers);
        const buyersData = await db.select().from(buyers);

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
    } catch (error) {
        console.error("List Users Error:", error);
        throw new Error("Failed to fetch users");
    }
};


export const getUserService = async (id: number): Promise<UserWithProfile | null> => {
    try {
        // Validate input
        if (!id || isNaN(id) || id <= 0) {
            throw new Error("Invalid user ID");
        }

        // Fetch user data
        const user = await db.query.users.findFirst({
            where: eq(users.id, id),
        });

        if (!user) return null;

        // Remove password from response
        const { password: _, ...userData } = user;

        // Fetch role-specific details
        let profile = null;

        if (user.role === "farmer") {
            const farmerData = await db.query.farmers.findFirst({
                where: eq(farmers.userId, id),
            });

            profile = farmerData
                ? {
                      location: farmerData.location?.trim() || null,
                      farmSize: farmerData.farmSize?.trim() || null,
                      primaryCrops: farmerData.primaryCrops?.trim() || null,
                  }
                : null;
        } else if (user.role === "buyer") {
            const buyerData = await db.query.buyers.findFirst({
                where: eq(buyers.userId, id),
            });

            profile = buyerData
                ? {
                      companyName: buyerData.companyName?.trim() || null,
                      businessType: buyerData.businessType?.trim() || null,
                  }
                : null;
        }

        return { ...userData, profile };
    } catch (error) {
        console.error("Get User Service Error:", error);
        throw new Error("Failed to fetch user");
    }
};


//Update user
// Extended User Type with Partial Role-Specific Data


/**
 * Update user details, including role-specific updates
 */
// Interface for role-specific updates
interface FarmerData {
    location?: string;
    farmSize?: string;
    primaryCrops?: string;
}

interface BuyerData {
    companyName?: string;
    businessType?: string;
}

// Extended User Type for Updates
type UpdateUserData = Partial<TSUsers> & Partial<FarmerData & BuyerData>;

/**
 * Update user details, including role-specific updates
 */
export const updateUserService = async (id: number, updatedUserData: UpdateUserData): Promise<Partial<TSUsers> | null> => {
    try {
        // Fetch existing user
        const user = await db.query.users.findFirst({
            where: eq(users.id, id),
        });

        if (!user) {
            throw new Error("User not found");
        }

        // Extract password separately
        const { password, ...userUpdateData } = updatedUserData;

        // Update common user fields (excluding password)
        if (Object.keys(userUpdateData).length > 0) {
            await db.update(users).set(userUpdateData).where(eq(users.id, id)).execute();
        }

        // If password is provided, hash it and update separately
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await db.update(users).set({ password: hashedPassword }).where(eq(users.id, id)).execute();
        }

        // Handle role-specific updates
        if (user.role === "farmer") {
            const farmerData = {
                location: updatedUserData.location,
                farmSize: updatedUserData.farmSize,
                primaryCrops: updatedUserData.primaryCrops,
            };

            if (Object.values(farmerData).some((value) => value !== undefined)) {
                await db.update(farmers).set(farmerData).where(eq(farmers.userId, id)).execute();
            }
        } else if (user.role === "buyer") {
            const buyerData = {
                companyName: updatedUserData.companyName,
                businessType: updatedUserData.businessType,
            };

            if (Object.values(buyerData).some((value) => value !== undefined)) {
                await db.update(buyers).set(buyerData).where(eq(buyers.userId, id)).execute();
            }
        }

        // Fetch updated user data without password
        const updatedUser = await db.query.users.findFirst({
            where: eq(users.id, id),
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
    } catch (error) {
        console.error("Update User Service Error:", error);
        throw new Error("Failed to update user");
    }
};


//Delete user by ID
export const deleteUserService = async (id:number): Promise<string> => {
    await db.delete(users).where(eq(users.id, id)).execute();
    return "User deleted successfully";
}