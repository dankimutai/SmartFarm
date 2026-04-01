"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserTransactionStats = exports.getTransactionDetails = exports.getTransactionsByUserId = exports.getAllTransactions = exports.getByOrderId = exports.getTransactionStatus = exports.handleCallback = exports.initiatePayment = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../drizzle/db");
const schema_1 = require("../drizzle/schema");
const axios_1 = __importDefault(require("axios"));
const getAccessToken = async () => {
    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString("base64");
    try {
        const response = await axios_1.default.get(`${process.env.MPESA_ENV}/oauth/v1/generate?grant_type=client_credentials`, {
            headers: { Authorization: `Basic ${auth}` }
        });
        return response.data.access_token;
    }
    catch (error) {
        console.error("Error getting Mpesa access token:", error);
        throw new Error("Failed to get access token");
    }
};
const generateTimestamp = () => {
    const date = new Date();
    return date.getFullYear() +
        String(date.getMonth() + 1).padStart(2, "0") +
        String(date.getDate()).padStart(2, "0") +
        String(date.getHours()).padStart(2, "0") +
        String(date.getMinutes()).padStart(2, "0") +
        String(date.getSeconds()).padStart(2, "0");
};
const initiatePayment = async (data) => {
    try {
        // 1. Create transaction record
        const transaction = await db_1.db.insert(schema_1.transactions)
            .values({
            orderId: data.orderId,
            amount: data.amount.toString(),
            currency: "KES",
            paymentMethod: "mpesa",
            status: "pending",
            metadata: {
                phoneNumber: data.phoneNumber
            }
        })
            .returning();
        if (!transaction.length) {
            throw new Error("Failed to create transaction record");
        }
        // 2. Generate Mpesa payment request
        const accessToken = await getAccessToken();
        const timestamp = generateTimestamp();
        const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString("base64");
        // 3. Send STK Push request
        const response = await axios_1.default.post(process.env.MPESA_STK_PUSH_URL, {
            BusinessShortCode: process.env.MPESA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: data.amount,
            PartyA: data.phoneNumber,
            PartyB: process.env.MPESA_SHORTCODE,
            PhoneNumber: data.phoneNumber,
            CallBackURL: `${process.env.BASE_URL}/mpesa/callback`,
            AccountReference: `{SmartFarm-V1} Order-${data.orderId}`,
            TransactionDesc: `Payment for Order ${data.orderId}`
        }, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        // 4. Update transaction with STK push details
        const metadata = transaction[0].metadata;
        await db_1.db.update(schema_1.transactions)
            .set({
            providerTransactionId: response.data.CheckoutRequestID,
            metadata: {
                ...metadata,
                checkoutRequestId: response.data.CheckoutRequestID,
                merchantRequestId: response.data.MerchantRequestID
            }
        })
            .where((0, drizzle_orm_1.eq)(schema_1.transactions.id, transaction[0].id));
        return {
            success: true,
            data: {
                transactionId: transaction[0].id,
                checkoutRequestId: response.data.CheckoutRequestID
            }
        };
    }
    catch (error) {
        console.error("Payment initiation error:", error);
        if (axios_1.default.isAxiosError(error)) {
            const mpesaError = error.response?.data;
            throw new Error(mpesaError?.errorMessage || error.message);
        }
        throw error;
    }
};
exports.initiatePayment = initiatePayment;
const handleCallback = async (payload) => {
    try {
        console.log("🔔 Received M-Pesa callback:", JSON.stringify(payload, null, 2));
        const { Body: { stkCallback: { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } } } = payload;
        console.log(`🔍 Checking transaction for CheckoutRequestID: ${CheckoutRequestID}`);
        console.log(`📊 Result Code received: ${ResultCode} (${typeof ResultCode})`);
        const transaction = await db_1.db.query.transactions.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.transactions.providerTransactionId, CheckoutRequestID)
        });
        if (!transaction) {
            console.error(`❌ Transaction not found for CheckoutRequestID: ${CheckoutRequestID}`);
            throw new Error("Transaction not found");
        }
        console.log(`✅ Found transaction ${transaction.id} for order ${transaction.orderId}`);
        // Convert ResultCode to string and then compare, or directly compare with number
        // This is the key fix - checking both string "0" and number 0
        const isSuccess = ResultCode === "0" || ResultCode === 0;
        const status = isSuccess ? "paid" : "failed";
        console.log(`🔄 Setting transaction status to: ${status} based on ResultCode: ${ResultCode}`);
        // Extract M-Pesa receipt number
        const mpesaReceipt = CallbackMetadata?.Item?.find((item) => item.Name === "MpesaReceiptNumber")?.Value;
        if (mpesaReceipt) {
            console.log(`📝 M-Pesa Receipt Number: ${mpesaReceipt}`);
        }
        // Get existing metadata
        const metadata = transaction.metadata;
        // Update transaction
        console.log(`🔄 Updating transaction ${transaction.id} status to ${status}`);
        await db_1.db.update(schema_1.transactions)
            .set({
            status,
            providerTransactionDate: new Date(),
            metadata: {
                ...metadata,
                resultCode: ResultCode,
                resultDesc: ResultDesc,
                mpesaReceipt,
                completedAt: new Date().toISOString()
            }
        })
            .where((0, drizzle_orm_1.eq)(schema_1.transactions.id, transaction.id));
        console.log(`✅ Transaction ${transaction.id} updated successfully`);
        // If payment was successful, update the order
        if (status === "paid") {
            console.log(`🔄 Updating order ${transaction.orderId} payment status to paid`);
            await db_1.db.update(schema_1.orders)
                .set({
                paymentStatus: "paid",
                // Optionally update order status if needed
                orderStatus: "confirmed"
            })
                .where((0, drizzle_orm_1.eq)(schema_1.orders.id, transaction.orderId));
            console.log(`✅ Order ${transaction.orderId} updated successfully`);
        }
        return {
            success: true,
            transactionId: transaction.id,
            orderId: transaction.orderId,
            status
        };
    }
    catch (error) {
        console.error("❌ Callback processing error:", error);
        throw error;
    }
};
exports.handleCallback = handleCallback;
const getTransactionStatus = async (id) => {
    const transaction = await db_1.db.query.transactions.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.transactions.id, id)
    });
    if (!transaction) {
        throw new Error("Transaction not found");
    }
    return {
        success: true,
        data: {
            id: transaction.id,
            status: transaction.status,
            amount: transaction.amount,
            createdAt: transaction.createdAt,
            metadata: transaction.metadata
        }
    };
};
exports.getTransactionStatus = getTransactionStatus;
const getByOrderId = async (orderId) => {
    try {
        return await db_1.db.query.transactions.findMany({
            where: (0, drizzle_orm_1.eq)(schema_1.transactions.orderId, orderId),
            orderBy: (transactions) => [transactions.createdAt],
        });
    }
    catch (error) {
        console.error(`Error fetching transactions for order ${orderId}:`, error);
        throw new Error("Failed to fetch transactions");
    }
};
exports.getByOrderId = getByOrderId;
const getAllTransactions = async (options) => {
    try {
        const { page = 1, limit = 20, status, startDate, endDate, sortBy = "createdAt", sortOrder = "desc", paymentMethod } = options;
        // Calculate offset for pagination
        const offset = (page - 1) * limit;
        // Build conditions for filtering
        let conditions = [];
        if (status) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.transactions.status, status));
        }
        if (paymentMethod) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.transactions.paymentMethod, paymentMethod));
        }
        if (startDate) {
            conditions.push((0, drizzle_orm_1.sql) `${schema_1.transactions.createdAt} >= ${startDate}`);
        }
        if (endDate) {
            conditions.push((0, drizzle_orm_1.sql) `${schema_1.transactions.createdAt} <= ${endDate}`);
        }
        // Combine all conditions with AND
        const whereClause = conditions.length > 0
            ? (0, drizzle_orm_1.and)(...conditions)
            : undefined;
        // Determine sort direction
        const sortDirection = sortOrder === "asc" ? drizzle_orm_1.asc : drizzle_orm_1.desc;
        // Map sortBy to the correct field
        let sortField;
        switch (sortBy) {
            case "amount":
                sortField = schema_1.transactions.amount;
                break;
            case "status":
                sortField = schema_1.transactions.status;
                break;
            case "paymentMethod":
                sortField = schema_1.transactions.paymentMethod;
                break;
            case "updatedAt":
                sortField = schema_1.transactions.updatedAt;
                break;
            case "createdAt":
            default:
                sortField = schema_1.transactions.createdAt;
        }
        // Fetch transactions with relationships
        const data = await db_1.db.query.transactions.findMany({
            where: whereClause,
            limit,
            offset,
            orderBy: [sortDirection(sortField)],
            with: {
                order: {
                    with: {
                        buyer: {
                            with: {
                                user: true
                            }
                        }
                    }
                }
            }
        });
        // Get total count for pagination
        const countQuery = whereClause
            ? db_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.transactions).where(whereClause)
            : db_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.transactions);
        const totalResult = await countQuery;
        const total = totalResult[0].count;
        const totalPages = Math.ceil(total / limit);
        return {
            success: true,
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages
            },
            filters: {
                status,
                startDate,
                endDate,
                paymentMethod
            },
            sorting: {
                sortBy,
                sortOrder
            }
        };
    }
    catch (error) {
        console.error("Error fetching all transactions:", error);
        throw new Error("Failed to fetch transactions");
    }
};
exports.getAllTransactions = getAllTransactions;
//Get Transactions by user id
const getTransactionsByUserId = async (userId) => {
    try {
        console.log(`Fetching transactions for user ${userId}`);
        // First get all orders for the user through the buyers table
        const buyerResult = await db_1.db.query.buyers.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.buyers.userId, userId),
            with: {
                orders: true
            }
        });
        if (!buyerResult) {
            console.log(`No buyer found for user ${userId}`);
            return [];
        }
        // Get all order IDs
        const orderIds = buyerResult.orders.map(order => order.id);
        if (orderIds.length === 0) {
            console.log(`No orders found for user ${userId}`);
            return [];
        }
        // Fetch all transactions for these orders
        const allTransactions = await db_1.db.query.transactions.findMany({
            where: (0, drizzle_orm_1.inArray)(schema_1.transactions.orderId, orderIds)
        });
        // Sort transactions by creation date (newest first)
        return allTransactions.sort((a, b) => {
            // Handle null dates
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });
    }
    catch (error) {
        console.error(`Error fetching transactions for user ${userId}:`, error);
        throw new Error("Failed to fetch user transactions");
    }
};
exports.getTransactionsByUserId = getTransactionsByUserId;
// For transactions details by transaction ID
const getTransactionDetails = async (transactionId) => {
    try {
        const transaction = await db_1.db.query.transactions.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.transactions.id, transactionId),
            with: {
                order: {
                    with: {
                        listing: {
                            with: {
                                product: true,
                                farmer: {
                                    with: {
                                        user: true
                                    }
                                }
                            }
                        },
                        buyer: {
                            with: {
                                user: true
                            }
                        }
                    }
                }
            }
        });
        if (!transaction) {
            throw new Error("Transaction not found");
        }
        return {
            success: true,
            data: transaction
        };
    }
    catch (error) {
        console.error(`Error fetching transaction details for ID ${transactionId}:`, error);
        throw new Error("Failed to fetch transaction details");
    }
};
exports.getTransactionDetails = getTransactionDetails;
// Get summarized transaction stats for a user
const getUserTransactionStats = async (userId) => {
    try {
        // First find the buyer associated with this user
        const buyer = await db_1.db.query.buyers.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.buyers.userId, userId)
        });
        if (!buyer) {
            return {
                totalTransactions: 0,
                totalPaid: "0",
                totalPending: "0",
                totalFailed: "0"
            };
        }
        // First get all orders for this buyer
        const buyerOrders = await db_1.db.query.orders.findMany({
            where: (0, drizzle_orm_1.eq)(schema_1.orders.buyerId, buyer.id)
        });
        if (!buyerOrders.length) {
            return {
                totalTransactions: 0,
                totalPaid: "0",
                totalPending: "0",
                totalFailed: "0"
            };
        }
        // Extract order IDs
        const orderIds = buyerOrders.map(order => order.id);
        // Now get all transactions for these orders
        const buyerTransactions = await db_1.db.query.transactions.findMany({
            where: (0, drizzle_orm_1.inArray)(schema_1.transactions.orderId, orderIds)
        });
        // Calculate stats
        const totalTransactions = buyerTransactions.length;
        let totalPaid = 0;
        let totalPending = 0;
        let totalFailed = 0;
        buyerTransactions.forEach(transaction => {
            const amount = parseFloat(transaction.amount.toString());
            if (transaction.status === "paid") {
                totalPaid += amount;
            }
            else if (transaction.status === "pending") {
                totalPending += amount;
            }
            else if (transaction.status === "failed") {
                totalFailed += amount;
            }
        });
        return {
            totalTransactions,
            totalPaid: totalPaid.toFixed(2),
            totalPending: totalPending.toFixed(2),
            totalFailed: totalFailed.toFixed(2)
        };
    }
    catch (error) {
        console.error(`Error fetching transaction stats for user ${userId}:`, error);
        throw new Error("Failed to fetch transaction statistics");
    }
};
exports.getUserTransactionStats = getUserTransactionStats;
