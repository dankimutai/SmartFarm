"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productWithListingSchema = exports.createListingSchema = exports.productFilterSchema = exports.updateProductSchema = exports.createProductSchema = exports.updateBuyerSchema = exports.createBuyerSchema = exports.updateRatingSchema = exports.createRatingSchema = exports.relatedPostsSchema = exports.searchQuerySchema = exports.updatePostSchema = exports.createPostSchema = exports.logisticsSchema = exports.updateFarmerSchema = exports.createFarmerSchema = exports.loginSchema = exports.registerSchema = exports.paymentStatusEnum = exports.orderStatusEnum = exports.updateListingStatusSchema = exports.listingSchema = exports.createOrderSchema = void 0;
const zod_1 = require("zod");
// Schema for decimal validation
const decimalString = zod_1.z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid decimal format");
// Order related schemas
exports.createOrderSchema = zod_1.z.object({
    buyerId: zod_1.z.number().positive(),
    listingId: zod_1.z.number().positive(),
    quantity: zod_1.z.number().positive().transform(val => val.toString()),
    totalPrice: zod_1.z.number().positive().transform(val => val.toString())
});
// Listing related schemas
exports.listingSchema = zod_1.z.object({
    farmerId: zod_1.z.number().positive(),
    productId: zod_1.z.number().positive(),
    quantity: decimalString,
    price: decimalString,
    availableDate: zod_1.z.string().datetime(),
    status: zod_1.z.enum(["active", "sold", "expired"]).optional().default("active"),
});
exports.updateListingStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['active', 'sold', 'expired'])
});
// Utility schemas for validation
exports.orderStatusEnum = zod_1.z.enum([
    "pending",
    "confirmed",
    "in_transit",
    "delivered",
    "cancelled",
]);
exports.paymentStatusEnum = zod_1.z.enum(["pending", "paid", "failed"]);
// Auth related schemas
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Name must be at least 2 characters").max(100),
    email: zod_1.z.string().email("Invalid email address"),
    phoneNumber: zod_1.z.string().regex(/^254[0-9]{9}$|^0[0-9]{9}$/, "Invalid phone number format"),
    password: zod_1.z.string().min(8, "Password is required"),
    role: zod_1.z.enum(["farmer", "buyer", "admin"]).default("farmer"),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(1, "Password is required"),
});
// Farmer related schemas
exports.createFarmerSchema = zod_1.z.object({
    userId: zod_1.z.number(),
    location: zod_1.z.string().min(2),
    farmSize: decimalString.optional(),
    primaryCrops: zod_1.z.string().optional(),
});
exports.updateFarmerSchema = exports.createFarmerSchema.partial();
exports.logisticsSchema = zod_1.z.object({
    orderId: zod_1.z.number(),
    pickupLocation: zod_1.z.string(),
    deliveryLocation: zod_1.z.string(),
    estimatedDeliveryDate: zod_1.z.date().optional(),
});
exports.createPostSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    content: zod_1.z.string().min(1).max(10000),
    category: zod_1.z.string().min(1).max(50),
});
exports.updatePostSchema = exports.createPostSchema.partial();
exports.searchQuerySchema = zod_1.z.object({
    query: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    authorId: zod_1.z.number().int().positive().optional(),
    page: zod_1.z.number().int().positive().default(1),
    limit: zod_1.z.number().int().positive().max(100).default(10),
    sortBy: zod_1.z.enum(["newest", "oldest", "trending"]).default("newest"),
});
exports.relatedPostsSchema = zod_1.z.object({
    category: zod_1.z.string().optional(),
    excludeCurrent: zod_1.z.boolean().default(true),
    limit: zod_1.z.number().int().positive().max(10).default(3),
});
exports.createRatingSchema = zod_1.z.object({
    ratedId: zod_1.z.number().positive(),
    orderId: zod_1.z.number().positive(),
    rating: zod_1.z.number().min(1).max(5),
    comment: zod_1.z.string().optional()
});
exports.updateRatingSchema = zod_1.z.object({
    rating: zod_1.z.number().min(1).max(5),
    comment: zod_1.z.string().optional()
});
exports.createBuyerSchema = zod_1.z.object({
    userId: zod_1.z.number(),
    shippingAddress: zod_1.z.string().min(2),
    preferredPaymentMethod: zod_1.z.enum(["mpesa", "card", "bank"]).optional(),
    deliveryInstructions: zod_1.z.string().optional(),
});
exports.updateBuyerSchema = exports.createBuyerSchema.partial();
// Product related schemas
exports.createProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    category: zod_1.z.string().min(2).max(50),
    unit: zod_1.z.enum(["kg", "ton", "bag", "crate"]),
    imageUrl: zod_1.z.string().url().optional(),
});
exports.updateProductSchema = exports.createProductSchema.partial();
exports.productFilterSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    minListings: zod_1.z.number().int().nonnegative().optional(),
});
// Listing validator
exports.createListingSchema = zod_1.z.object({
    farmerId: zod_1.z.number().int().positive(),
    productId: zod_1.z.number().int().positive(),
    quantity: zod_1.z.number().positive(),
    price: zod_1.z.number().positive(),
    availableDate: zod_1.z.string().datetime(),
    status: zod_1.z.enum(['active', 'sold', 'expired']).default('active'),
});
// Combined schema for product with listing
// Combined schema for product with listing
exports.productWithListingSchema = zod_1.z.object({
    product: exports.createProductSchema,
    listing: exports.createListingSchema,
});
