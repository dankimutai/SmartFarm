import { Context } from "hono";
import { registerUser, loginUser } from "./auth.service";
import { registerSchema, loginSchema } from "../validators/validator";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";

export const register = async (c: Context) => {
    try {
        const data = await c.req.json();
        const validatedData = registerSchema.parse(data);
        const result = await registerUser(validatedData);

        return c.json({
            status: "success",
            ...result
        }, 201);
    } catch (error: any) {
        // Initialize with a valid Hono status code
        let statusCode = 500;
        let errorMessage = "An unexpected error occurred during registration";
        
        // Handle Zod validation errors
        if (error instanceof ZodError) {
            const formattedErrors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));
            
            // Use the status code directly in c.json() instead of a variable
            return c.json({
                status: "error",
                message: "Please check your information and try again",
                errors: formattedErrors
            }, 400);
        }
        
        // Handle HTTPException
        if (error instanceof HTTPException) {
            statusCode = error.status;
            errorMessage = error.message;
        } else if (error.message) {
            // For other errors with a message property
            errorMessage = error.message;
        }
        
        console.error("Registration error:", error);
        
        // Use the statusCode directly as a literal or cast it to the appropriate type
        return c.json({
            status: "error",
            message: errorMessage
        }, statusCode as 400 | 401 | 403 | 404 | 409 | 500);
    }
};

export const login = async (c: Context) => {
    try {
        const data = await c.req.json();
        const validatedData = loginSchema.parse(data);
        const loginResult = await loginUser(validatedData);

        return c.json({
            status: "success",
            ...loginResult
        }, 200);
    } catch (error: any) {
        let errorMessage = "An unexpected error occurred during login";
        
        // Handle Zod validation errors
        if (error instanceof ZodError) {
            const formattedErrors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));
            
            return c.json({
                status: "error",
                message: "Please check your login information",
                errors: formattedErrors
            }, 400);
        }
        
        // Set the status code and message based on the type of error
        let responseStatus = 500;
        
        if (error instanceof HTTPException) {
            responseStatus = error.status;
            errorMessage = error.message;
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        console.error("Login error:", error);
        
        // Use the status code directly as a literal or cast it
        return c.json({
            status: "error",
            message: errorMessage
        }, responseStatus as 400 | 401 | 403 | 404 | 500);
    }
};