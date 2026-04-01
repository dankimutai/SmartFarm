import { Context, Next } from "hono";
import { verifyToken } from "../utils/auth";
import "dotenv/config";

// Define the JWT payload structure we expect from our token
interface TokenPayload {
    userId: number;
    email: string;
    role: string;
    exp?: number;
    iat?: number;
}

interface AuthenticatedRequest {
    user?: TokenPayload;
}

// Type guard to verify the shape of our payload
function isTokenPayload(payload: unknown): payload is TokenPayload {
    if (!payload || typeof payload !== 'object') return false;
    
    const p = payload as any;
    return (
        typeof p.userId === 'number' &&
        typeof p.email === 'string' &&
        typeof p.role === 'string'
    );
}

export const authMiddleware = (requiredRole: string) => {
    return async (c: Context & { req: AuthenticatedRequest }, next: Next) => {
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

            const decoded = await verifyToken(token);
            
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

        } catch (error) {
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

// Role-specific middleware instances
export const adminRoleAuth = authMiddleware("admin");
export const farmerRoleAuth = authMiddleware("farmer");
export const buyerRoleAuth = authMiddleware("buyer");
export const allRolesAuth = authMiddleware("all");