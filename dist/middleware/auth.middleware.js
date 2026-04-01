"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allRolesAuth = exports.buyerRoleAuth = exports.farmerRoleAuth = exports.adminRoleAuth = exports.authMiddleware = void 0;
const auth_1 = require("../utils/auth");
require("dotenv/config");
// Type guard to verify the shape of our payload
function isTokenPayload(payload) {
    if (!payload || typeof payload !== 'object')
        return false;
    const p = payload;
    return (typeof p.userId === 'number' &&
        typeof p.email === 'string' &&
        typeof p.role === 'string');
}
const authMiddleware = (requiredRole) => {
    return async (c, next) => {
        try {
            const authHeader = c.req.header("Authorization") || c.req.header("authorization");
            if (!authHeader?.startsWith("Bearer ")) {
                return c.json({
                    success: false,
                    error: "Unauthorized: Bearer token required"
                }, 401);
            }
            const token = authHeader.split(" ")[1];
            if (!token) {
                return c.json({
                    success: false,
                    error: "Unauthorized: No token provided"
                }, 401);
            }
            const decoded = await (0, auth_1.verifyToken)(token);
            if (!decoded) {
                return c.json({
                    success: false,
                    error: "Unauthorized: Invalid token"
                }, 401);
            }
            // Validate the payload structure
            if (!isTokenPayload(decoded)) {
                return c.json({
                    success: false,
                    error: "Unauthorized: Invalid token payload structure"
                }, 401);
            }
            // Now TypeScript knows this is a valid TokenPayload
            const payload = decoded;
            // Validate role if required
            if (requiredRole !== "all" && payload.role !== requiredRole) {
                return c.json({
                    success: false,
                    error: "Forbidden: Invalid role",
                    required: requiredRole,
                    provided: payload.role
                }, 403);
            }
            // Set user in context with validated payload
            c.set("user", {
                userId: payload.userId,
                email: payload.email,
                role: payload.role,
                exp: payload.exp,
                iat: payload.iat
            });
            await next();
        }
        catch (error) {
            console.error("Authentication error:", error);
            if (error instanceof Error) {
                return c.json({
                    success: false,
                    error: `Authentication failed: ${error.message}`
                }, 401);
            }
            return c.json({
                success: false,
                error: "Authentication failed"
            }, 401);
        }
    };
};
exports.authMiddleware = authMiddleware;
// Role-specific middleware instances
exports.adminRoleAuth = (0, exports.authMiddleware)("admin");
exports.farmerRoleAuth = (0, exports.authMiddleware)("farmer");
exports.buyerRoleAuth = (0, exports.authMiddleware)("buyer");
exports.allRolesAuth = (0, exports.authMiddleware)("all");
