import { Context } from "hono";
import { z } from "zod";
import * as paymentService from "./transactions.service";
import { getAllTransactions, getByOrderId,getTransactionsByUserId,getTransactionDetails,getUserTransactionStats} from "./transactions.service";


const initiatePaymentSchema = z.object({
  orderId: z.number(),
  phoneNumber: z.string().regex(/^254\d{9}$/, {
    message: "Phone number must be in format 254XXXXXXXXX"
  }),
  amount: z.number().positive()
});

const orderIdParamSchema = z.object({
  orderId: z.string().transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val) && val > 0, {
      message: "Order ID must be a positive integer"
    })
});


// Validation schemas
const getAllTransactionsSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  status: z.enum(['pending', 'paid', 'failed']).optional(),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  sortBy: z.enum(['createdAt', 'amount', 'status', 'paymentMethod', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  paymentMethod: z.string().optional()
});

const transactionIdSchema = z.object({
  id: z.string().transform(val => parseInt(val))
});

const orderIdSchema = z.object({
  orderId: z.string().transform(val => parseInt(val))
});

export const paymentController = {
  initiatePayment: async (c: Context) => {
    try {
      const body = await c.req.json();
      
      const validatedData = initiatePaymentSchema.parse(body);
      
      const result = await paymentService.initiatePayment(validatedData);

      return c.json({
        success: true,
        message: "Payment initiated successfully",
        data: result.data
      });

    } catch (error) {
      console.error("Payment initiation error:", error);
      
      if (error instanceof z.ZodError) {
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

  handleCallback: async (c: Context) => {
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

    } catch (error) {
      console.error("❌ Callback processing error:", error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to process callback"
      }, 500);
    }
  },

  getTransactionStatus: async (c: Context) => {
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

    } catch (error) {
      console.error("Transaction status check error:", error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get transaction status"
      }, 500);
    }
  },
  async getAllTransactions(c: Context) {
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
      const {
        page,
        limit,
        status,
        startDate,
        endDate,
        sortBy,
        sortOrder,
        paymentMethod
      } = validationResult.data;
      
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
      const result = await getAllTransactions({
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
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      
      return c.json({
        success: false,
        message: error.message || 'Failed to fetch transactions'
      }, 500);
    }
  },
  getTransactionsByOrderId: async (c: Context) => {
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
      const transactions = await getByOrderId(orderId);
      
      return c.json({
        success: true,
        data: transactions,
        orderId
      }, 200);
    } catch (error: any) {
      console.error("Error fetching transactions for order:", error);
      return c.json({
        success: false,
        message: error.message || "Failed to fetch transactions for order"
      }, 500);
    }
  },

  //Get Transactions by user id
  getUserTransactions: async (c: Context) => {
    try {
      // Get user ID from authenticated user
      const userId = parseInt(c.req.param("userId"));
      
      if (!userId) {
        return c.json({ 
          success: false, 
          message: "User not authenticated" 
        }, 401);
      }
  
      const transactions = await getTransactionsByUserId(userId);
      
      return c.json({
        success: true,
        data: transactions
      }, 200);
    } catch (error: any) {
      console.error("Error in getUserTransactions controller:", error);
      return c.json({
        success: false,
        message: error.message || "Failed to fetch user transactions"
      }, 500);
    }
  },
  getTransactionDetails: async (c: Context) => {
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
      
      const result = await getTransactionDetails(transactionId);
      
      // Verify that the transaction belongs to this user
      if (result.data.order.buyer.userId !== userId) {
        return c.json({
          success: false,
          message: "Unauthorized access to transaction"
        }, 403);
      }
      
      return c.json(result, 200);
    } catch (error: any) {
      console.error("Error in getTransactionDetails controller:", error);
      return c.json({
        success: false,
        message: error.message || "Failed to fetch transaction details"
      }, 500);
    }
  },
  
  getUserTransactionStats: async (c: Context) => {
    try {
      // Get user ID from authenticated user
      const userId = parseInt(c.req.param("userId"));
      
      if (!userId) {
        return c.json({ 
          success: false, 
          message: "User not authenticated" 
        }, 401);
      }
  
      const stats = await getUserTransactionStats(userId);
      
      return c.json({
        success: true,
        data: stats
      }, 200);
    } catch (error: any) {
      console.error("Error in getUserTransactionStats controller:", error);
      return c.json({
        success: false,
        message: error.message || "Failed to fetch transaction statistics"
      }, 500);
    }
  }
};

