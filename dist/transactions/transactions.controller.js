"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentController = void 0;
const zod_1 = require("zod");
const paymentService = __importStar(require("./transactions.service"));
const transactions_service_1 = require("./transactions.service");
const initiatePaymentSchema = zod_1.z.object({
    orderId: zod_1.z.number(),
    phoneNumber: zod_1.z.string().regex(/^254\d{9}$/, {
        message: "Phone number must be in format 254XXXXXXXXX"
    }),
    amount: zod_1.z.number().positive()
});
const orderIdParamSchema = zod_1.z.object({
    orderId: zod_1.z.string().transform(val => parseInt(val, 10))
        .refine(val => !isNaN(val) && val > 0, {
        message: "Order ID must be a positive integer"
    })
});
// Validation schemas
const getAllTransactionsSchema = zod_1.z.object({
    page: zod_1.z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: zod_1.z.string().optional().transform(val => val ? parseInt(val) : 20),
    status: zod_1.z.enum(['pending', 'paid', 'failed']).optional(),
    startDate: zod_1.z.string().optional().transform(val => val ? new Date(val) : undefined),
    endDate: zod_1.z.string().optional().transform(val => val ? new Date(val) : undefined),
    sortBy: zod_1.z.enum(['createdAt', 'amount', 'status', 'paymentMethod', 'updatedAt']).optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    paymentMethod: zod_1.z.string().optional()
});
const transactionIdSchema = zod_1.z.object({
    id: zod_1.z.string().transform(val => parseInt(val))
});
const orderIdSchema = zod_1.z.object({
    orderId: zod_1.z.string().transform(val => parseInt(val))
});
exports.paymentController = {
    initiatePayment: async (c) => {
        try {
            const body = await c.req.json();
            const validatedData = initiatePaymentSchema.parse(body);
            const result = await paymentService.initiatePayment(validatedData);
            return c.json({
                success: true,
                message: "Payment initiated successfully",
                data: result.data
            });
        }
        catch (error) {
            console.error("Payment initiation error:", error);
            if (error instanceof zod_1.z.ZodError) {
                return c.json({
                    success: false,
                    message: "Invalid input data",
                    errors: error.errors
                }, 400);
            }
            // Handle Mpesa API specific errors
            const errorMessage = error instanceof Error ? error.message : "Payment initiation failed";
            const statusCode = errorMessage.includes("Invalid") ? 400 : 500;
            return c.json({
                success: false,
                message: errorMessage,
                error: {
                    type: statusCode === 400 ? "validation_error" : "server_error",
                    details: errorMessage
                }
            }, statusCode);
        }
    },
    handleCallback: async (c) => {
        try {
            console.log("🔔 Received M-Pesa callback");
            const payload = await c.req.json();
            console.log("📦 Callback payload:", JSON.stringify(payload, null, 2));
            if (!payload?.Body?.stkCallback) {
                console.log("❌ Invalid callback payload");
                return c.json({
                    success: false,
                    message: "Invalid callback payload"
                }, 400);
            }
            const result = await paymentService.handleCallback(payload);
            console.log("✅ Callback processed successfully");
            return c.json(result);
        }
        catch (error) {
            console.error("❌ Callback processing error:", error);
            return c.json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to process callback"
            }, 500);
        }
    },
    getTransactionStatus: async (c) => {
        try {
            const id = Number(c.req.param("id"));
            if (isNaN(id) || id <= 0) {
                return c.json({
                    success: false,
                    message: "Invalid transaction ID"
                }, 400);
            }
            const result = await paymentService.getTransactionStatus(id);
            return c.json(result);
        }
        catch (error) {
            console.error("Transaction status check error:", error);
            return c.json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to get transaction status"
            }, 500);
        }
    },
    async getAllTransactions(c) {
        try {
            // Extract and validate query parameters
            const queryParams = c.req.query();
            // Validate with Zod schema
            const validationResult = getAllTransactionsSchema.safeParse({
                page: queryParams.page,
                limit: queryParams.limit,
                status: queryParams.status,
                startDate: queryParams.startDate,
                endDate: queryParams.endDate,
                sortBy: queryParams.sortBy,
                sortOrder: queryParams.sortOrder,
                paymentMethod: queryParams.paymentMethod
            });
            if (!validationResult.success) {
                return c.json({
                    success: false,
                    message: 'Validation error',
                    errors: validationResult.error.format()
                }, 400);
            }
            // Extract valid parameters
            const { page, limit, status, startDate, endDate, sortBy, sortOrder, paymentMethod } = validationResult.data;
            // Validate pagination limits
            if (page < 1) {
                return c.json({
                    success: false,
                    message: 'Page number must be greater than 0'
                }, 400);
            }
            if (limit < 1 || limit > 100) {
                return c.json({
                    success: false,
                    message: 'Limit must be between 1 and 100'
                }, 400);
            }
            // Get transactions with filters
            const result = await (0, transactions_service_1.getAllTransactions)({
                page,
                limit,
                status,
                startDate,
                endDate,
                sortBy,
                sortOrder,
                paymentMethod
            });
            return c.json(result);
        }
        catch (error) {
            console.error('Error fetching transactions:', error);
            return c.json({
                success: false,
                message: error.message || 'Failed to fetch transactions'
            }, 500);
        }
    },
    getTransactionsByOrderId: async (c) => {
        try {
            const validationResult = orderIdParamSchema.safeParse({
                orderId: c.req.param('orderId')
            });
            if (!validationResult.success) {
                return c.json({
                    success: false,
                    message: "Invalid order ID",
                    errors: validationResult.error.format()
                }, 400);
            }
            const { orderId } = validationResult.data;
            const transactions = await (0, transactions_service_1.getByOrderId)(orderId);
            return c.json({
                success: true,
                data: transactions,
                orderId
            }, 200);
        }
        catch (error) {
            console.error("Error fetching transactions for order:", error);
            return c.json({
                success: false,
                message: error.message || "Failed to fetch transactions for order"
            }, 500);
        }
    },
    //Get Transactions by user id
    getUserTransactions: async (c) => {
        try {
            // Get user ID from authenticated user
            const userId = parseInt(c.req.param("userId"));
            if (!userId) {
                return c.json({
                    success: false,
                    message: "User not authenticated"
                }, 401);
            }
            const transactions = await (0, transactions_service_1.getTransactionsByUserId)(userId);
            return c.json({
                success: true,
                data: transactions
            }, 200);
        }
        catch (error) {
            console.error("Error in getUserTransactions controller:", error);
            return c.json({
                success: false,
                message: error.message || "Failed to fetch user transactions"
            }, 500);
        }
    },
    getTransactionDetails: async (c) => {
        try {
            const transactionId = parseInt(c.req.param("id"));
            if (isNaN(transactionId)) {
                return c.json({
                    success: false,
                    message: "Invalid transaction ID"
                }, 400);
            }
            // Get user ID from authenticated user to verify ownership
            const userId = parseInt(c.req.param("userId"));
            if (!userId) {
                return c.json({
                    success: false,
                    message: "User not authenticated"
                }, 401);
            }
            const result = await (0, transactions_service_1.getTransactionDetails)(transactionId);
            // Verify that the transaction belongs to this user
            if (result.data.order.buyer.userId !== userId) {
                return c.json({
                    success: false,
                    message: "Unauthorized access to transaction"
                }, 403);
            }
            return c.json(result, 200);
        }
        catch (error) {
            console.error("Error in getTransactionDetails controller:", error);
            return c.json({
                success: false,
                message: error.message || "Failed to fetch transaction details"
            }, 500);
        }
    },
    getUserTransactionStats: async (c) => {
        try {
            // Get user ID from authenticated user
            const userId = parseInt(c.req.param("userId"));
            if (!userId) {
                return c.json({
                    success: false,
                    message: "User not authenticated"
                }, 401);
            }
            const stats = await (0, transactions_service_1.getUserTransactionStats)(userId);
            return c.json({
                success: true,
                data: stats
            }, 200);
        }
        catch (error) {
            console.error("Error in getUserTransactionStats controller:", error);
            return c.json({
                success: false,
                message: error.message || "Failed to fetch transaction statistics"
            }, 500);
        }
    }
};
