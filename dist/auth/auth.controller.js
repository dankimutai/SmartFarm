"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const auth_service_1 = require("./auth.service");
const validator_1 = require("../validators/validator");
const http_exception_1 = require("hono/http-exception");
const zod_1 = require("zod");
const register = async (c) => {
    try {
        const data = await c.req.json();
        const validatedData = validator_1.registerSchema.parse(data);
        const result = await (0, auth_service_1.registerUser)(validatedData);
        return c.json({
            status: "success",
            ...result
        }, 201);
    }
    catch (error) {
        // Initialize with a valid Hono status code
        let statusCode = 500;
        let errorMessage = "An unexpected error occurred during registration";
        // Handle Zod validation errors
        if (error instanceof zod_1.ZodError) {
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
        if (error instanceof http_exception_1.HTTPException) {
            statusCode = error.status;
            errorMessage = error.message;
        }
        else if (error.message) {
            // For other errors with a message property
            errorMessage = error.message;
        }
        console.error("Registration error:", error);
        // Use the statusCode directly as a literal or cast it to the appropriate type
        return c.json({
            status: "error",
            message: errorMessage
        }, statusCode);
    }
};
exports.register = register;
const login = async (c) => {
    try {
        const data = await c.req.json();
        const validatedData = validator_1.loginSchema.parse(data);
        const loginResult = await (0, auth_service_1.loginUser)(validatedData);
        return c.json({
            status: "success",
            ...loginResult
        }, 200);
    }
    catch (error) {
        let errorMessage = "An unexpected error occurred during login";
        // Handle Zod validation errors
        if (error instanceof zod_1.ZodError) {
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
        if (error instanceof http_exception_1.HTTPException) {
            responseStatus = error.status;
            errorMessage = error.message;
        }
        else if (error.message) {
            errorMessage = error.message;
        }
        console.error("Login error:", error);
        // Use the status code directly as a literal or cast it
        return c.json({
            status: "error",
            message: errorMessage
        }, responseStatus);
    }
};
exports.login = login;
