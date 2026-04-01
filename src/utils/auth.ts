// auth.utils.ts
import { sign, verify } from "hono/jwt";
import { compare, hash } from "bcryptjs";
import "dotenv/config";


export interface TokenPayload {
    userId: number;
    role: string;
    email: string;
    farmerId?: number;
    buyerId?: number;
  }
  

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
    if (!password) {
        throw new Error("Password is required");
    }
    return await hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    if (!password || !hashedPassword) {
        throw new Error("Both password and hashedPassword are required");
    }
    return await compare(password, hashedPassword);
}

export async function generateToken(payload: TokenPayload): Promise<string> {
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

    return await sign(tokenPayload, JWT_SECRET);
}

export async function verifyToken(token: string) {
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }
    if (!token) {
        throw new Error("Token is required");
    }
    
    try {
        const decoded = await verify(token, JWT_SECRET);
        
        // Verify token hasn't expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < currentTime) {
            throw new Error("Token has expired");
        }
        
        return decoded;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Token verification failed: ${error.message}`);
        }
        throw new Error("Token verification failed");
    }
}