import { db } from "../drizzle/db";
import { users, farmers, buyers } from "../drizzle/schema";
import { RegisterInput, LoginInput } from "../validators/validator";
import { hashPassword, comparePassword, generateToken } from "../utils/auth";
import { HTTPException } from "hono/http-exception";
import { eq } from "drizzle-orm";

export interface TokenPayload {
    userId: number;
    role: string;
    email: string;
    farmerId?: number;
    buyerId?: number;
}

/**
 * Register a new user
 */
export const registerUser = async (input: RegisterInput) => {
    try {
        // Check if email already exists
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, input.email),
        });

        if (existingUser) {
            throw new HTTPException(409, { message: "This email is already registered. Please use a different email or try logging in." });
        }

        // Hash the password before storing
        const hashedPassword = await hashPassword(input.password);

        // Create the user
        const [user] = await db
            .insert(users)
            .values({
                name: input.name ?? '',
                email: input.email ?? '',
                phoneNumber: input.phoneNumber,
                password: hashedPassword,
                role: input.role ?? '',
            })
            .returning();

        // Create a role-specific profile
        if (input.role === "farmer") {
            await db.insert(farmers).values({
                userId: user.id,
                location: '',
                farmSize: "0",
                primaryCrops: '',
            });
        } else if (input.role === "buyer") {
            await db.insert(buyers).values({
                userId: user.id,
                companyName: '',
                businessType: '',
            });
        }

        // Generate JWT token
        const token = await generateToken({ userId: user.id, email: user.email, role: user.role ?? "" });

        // Remove password before sending response
        const { password: _, ...userData } = user;

        return {
            message: "Your account has been successfully created!",
            user: userData,
            token
        };
    } catch (error) {
        // Re-throw HTTPExceptions so they're handled properly in the controller
        if (error instanceof HTTPException) {
            throw error;
        }
        
        console.error("Registration Error:", error);
        throw new HTTPException(500, { message: "We couldn't create your account right now. Please try again later." });
    }
};

/**
 * Login a user
 */
export const loginUser = async (input: LoginInput) => {
    try {
        // First get user with relations to farmer and buyer
        const user = await db.query.users.findFirst({
            where: eq(users.email, input.email),
            with: {
                farmer: true,
                buyer: true
            }
        });

        if (!user) {
            throw new HTTPException(401, { message: "The email or password you entered is incorrect" });
        }

        const isValidPassword = await comparePassword(input.password, user.password);
        if (!isValidPassword) {
            throw new HTTPException(401, { message: "The email or password you entered is incorrect" });
        }

        // Get the appropriate ID based on role
        let roleSpecificId: number | undefined;
        if (user.role === 'farmer' && user.farmer) {
            roleSpecificId = user.farmer.id;
        } else if (user.role === 'buyer' && user.buyer) {
            roleSpecificId = user.buyer.id;
        }

        // Generate token with role-specific ID
        const token = await generateToken({
            userId: user.id,
            role: user.role ?? "",
            email: user.email,
            farmerId: user.role === 'farmer' ? roleSpecificId : undefined,
            buyerId: user.role === 'buyer' ? roleSpecificId : undefined
        });

        // Remove password and restructure response
        const { password: _, ...userData } = user;
        
        // Add role-specific ID to response
        const responseData = {
            ...userData,
            farmerId: user.role === 'farmer' ? roleSpecificId : undefined,
            buyerId: user.role === 'buyer' ? roleSpecificId : undefined
        };

        return {
            message: "Welcome back! You've successfully logged in.",
            token,
            user: responseData
        };
    } catch (error) {
        // Re-throw HTTPExceptions so they're handled properly in the controller
        if (error instanceof HTTPException) {
            throw error;
        }
        
        console.error("Login Error:", error);
        throw new HTTPException(500, { message: "We're having trouble signing you in. Please try again later." });
    }
};