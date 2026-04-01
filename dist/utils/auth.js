"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
// auth.utils.ts
const jwt_1 = require("hono/jwt");
const bcryptjs_1 = require("bcryptjs");
require("dotenv/config");
const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;
async function hashPassword(password) {
    if (!password) {
        throw new Error("Password is required");
    }
    return await (0, bcryptjs_1.hash)(password, SALT_ROUNDS);
}
async function comparePassword(password, hashedPassword) {
    if (!password || !hashedPassword) {
        throw new Error("Both password and hashedPassword are required");
    }
    return await (0, bcryptjs_1.compare)(password, hashedPassword);
}
async function generateToken(payload) {
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }
    if (!payload.userId || !payload.role || !payload.email) {
        throw new Error("Invalid token payload - missing required fields");
    }
    // Add token expiration
    const tokenPayload = {
        ...payload,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
        iat: Math.floor(Date.now() / 1000)
    };
    return await (0, jwt_1.sign)(tokenPayload, JWT_SECRET);
}
async function verifyToken(token) {
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }
    if (!token) {
        throw new Error("Token is required");
    }
    try {
        const decoded = await (0, jwt_1.verify)(token, JWT_SECRET);
        // Verify token hasn't expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < currentTime) {
            throw new Error("Token has expired");
        }
        return decoded;
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Token verification failed: ${error.message}`);
        }
        throw new Error("Token verification failed");
    }
}
