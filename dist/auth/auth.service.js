"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const db_1 = require("../drizzle/db");
const schema_1 = require("../drizzle/schema");
const auth_1 = require("../utils/auth");
const http_exception_1 = require("hono/http-exception");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Register a new user
 */
const registerUser = async (input) => {
    try {
        // Check if email already exists
        const existingUser = await db_1.db.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.users.email, input.email),
        });
        if (existingUser) {
            throw new http_exception_1.HTTPException(409, { message: "This email is already registered. Please use a different email or try logging in." });
        }
        // Hash the password before storing
        const hashedPassword = await (0, auth_1.hashPassword)(input.password);
        // Create the user
        const [user] = await db_1.db
            .insert(schema_1.users)
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
            await db_1.db.insert(schema_1.farmers).values({
                userId: user.id,
                location: '',
                farmSize: "0",
                primaryCrops: '',
            });
        }
        else if (input.role === "buyer") {
            await db_1.db.insert(schema_1.buyers).values({
                userId: user.id,
                companyName: '',
                businessType: '',
            });
        }
        // Generate JWT token
        const token = await (0, auth_1.generateToken)({ userId: user.id, email: user.email, role: user.role ?? "" });
        // Remove password before sending response
        const { password: _, ...userData } = user;
        return {
            message: "Your account has been successfully created!",
            user: userData,
            token
        };
    }
    catch (error) {
        // Re-throw HTTPExceptions so they're handled properly in the controller
        if (error instanceof http_exception_1.HTTPException) {
            throw error;
        }
        console.error("Registration Error:", error);
        throw new http_exception_1.HTTPException(500, { message: "We couldn't create your account right now. Please try again later." });
    }
};
exports.registerUser = registerUser;
/**
 * Login a user
 */
const loginUser = async (input) => {
    try {
        // First get user with relations to farmer and buyer
        const user = await db_1.db.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.users.email, input.email),
            with: {
                farmer: true,
                buyer: true
            }
        });
        if (!user) {
            throw new http_exception_1.HTTPException(401, { message: "The email or password you entered is incorrect" });
        }
        const isValidPassword = await (0, auth_1.comparePassword)(input.password, user.password);
        if (!isValidPassword) {
            throw new http_exception_1.HTTPException(401, { message: "The email or password you entered is incorrect" });
        }
        // Get the appropriate ID based on role
        let roleSpecificId;
        if (user.role === 'farmer' && user.farmer) {
            roleSpecificId = user.farmer.id;
        }
        else if (user.role === 'buyer' && user.buyer) {
            roleSpecificId = user.buyer.id;
        }
        // Generate token with role-specific ID
        const token = await (0, auth_1.generateToken)({
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
    }
    catch (error) {
        // Re-throw HTTPExceptions so they're handled properly in the controller
        if (error instanceof http_exception_1.HTTPException) {
            throw error;
        }
        console.error("Login Error:", error);
        throw new http_exception_1.HTTPException(500, { message: "We're having trouble signing you in. Please try again later." });
    }
};
exports.loginUser = loginUser;
