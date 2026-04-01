import { z } from "zod";
import { roleEnum, listingStatusEnum } from "../drizzle/schema";

// Type definitions
export type OrderStatus = "pending" | "confirmed" | "in_transit" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed";
export type ListingStatus = "active" | "sold" | "expired";

// Schema for decimal validation
const decimalString = z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid decimal format");

// Order related schemas
export const createOrderSchema = z.object({
  buyerId: z.number().positive(),
  listingId: z.number().positive(),
  quantity: z.number().positive().transform(val => val.toString()),
  totalPrice: z.number().positive().transform(val => val.toString())
});

// Interfaces for orders
export interface CreateOrderInput {
  buyerId: number;
  listingId: number;
  quantity: string;
  totalPrice: string;
}

export interface Order {
  id: number;
  buyerId: number;
  listingId: number;
  quantity: string;
  totalPrice: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Listing related schemas
export const listingSchema = z.object({
  farmerId: z.number().positive(),
  productId: z.number().positive(),
  quantity: decimalString,
  price: decimalString,
  availableDate: z.string().datetime(),
  status: z.enum(["active", "sold", "expired"]).optional().default("active"),
});

export const updateListingStatusSchema = z.object({
  status: z.enum(['active', 'sold', 'expired'])
});

// Listing interfaces
export interface Listing {
  id: number;
  farmerId: number;
  productId: number;
  quantity: string;
  price: string;
  availableDate: Date;
  status: ListingStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Types with relations
export interface OrderWithRelations extends Order {
  buyer: {
    id: number;
    name: string;
    email: string;
  };
  listing: Listing & {
    farmer: {
      id: number;
      name: string;
    };
    product: {
      id: number;
      name: string;
    };
  };
}

// Utility schemas for validation
export const orderStatusEnum = z.enum([
  "pending",
  "confirmed",
  "in_transit",
  "delivered",
  "cancelled",
]);

export const paymentStatusEnum = z.enum(["pending", "paid", "failed"]);

// Auth related schemas
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().regex(/^254[0-9]{9}$|^0[0-9]{9}$/, "Invalid phone number format"),
  password: z.string().min(8, "Password is required"),
  role: z.enum(["farmer", "buyer", "admin"]).default("farmer"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Farmer related schemas
export const createFarmerSchema = z.object({
  userId: z.number(),
  location: z.string().min(2),
  farmSize: decimalString.optional(),
  primaryCrops: z.string().optional(),
});

export const updateFarmerSchema = createFarmerSchema.partial();



export const logisticsSchema = z.object({
  orderId: z.number(),
  pickupLocation: z.string(),
  deliveryLocation: z.string(),
  estimatedDeliveryDate: z.date().optional(),
});

export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  category: z.string().min(1).max(50),
});

export const updatePostSchema = createPostSchema.partial();

export const searchQuerySchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  authorId: z.number().int().positive().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  sortBy: z.enum(["newest", "oldest", "trending"]).default("newest"),
});

export const relatedPostsSchema = z.object({
  category: z.string().optional(),
  excludeCurrent: z.boolean().default(true),
  limit: z.number().int().positive().max(10).default(3),
});

export const createRatingSchema = z.object({
  ratedId: z.number().positive(),
  orderId: z.number().positive(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional()
});

export const updateRatingSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional()
});


export const createBuyerSchema = z.object({
  userId: z.number(),
  shippingAddress: z.string().min(2),
  preferredPaymentMethod: z.enum(["mpesa", "card", "bank"]).optional(),
  deliveryInstructions: z.string().optional(),
});

export const updateBuyerSchema = createBuyerSchema.partial();


export interface Product {
  id: number;
  name: string;
  category: string;
  unit: string;
  imageUrl: string;
}

export interface ProductResponse {
  success: boolean;
  data: Product[];
  error?: string;
}
// Product related schemas
export const createProductSchema = z.object({
  name: z.string().min(2).max(100),
  category: z.string().min(2).max(50),
  unit: z.enum(["kg", "ton", "bag", "crate"]),
  imageUrl: z.string().url().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productFilterSchema = z.object({
  name: z.string().optional(),
  category: z.string().optional(),
  minListings: z.number().int().nonnegative().optional(),
});




// Listing validator
export const createListingSchema = z.object({
  farmerId: z.number().int().positive(),
  productId: z.number().int().positive(),
  quantity: z.number().positive(),
  price: z.number().positive(),
  availableDate: z.string().datetime(),
  status: z.enum(['active', 'sold', 'expired']).default('active'),
});

// Combined schema for product with listing
// Combined schema for product with listing
export const productWithListingSchema = z.object({
  product: createProductSchema,
  listing: createListingSchema,
});

// Response type
export interface ProductWithListingResponse {
  success: boolean;
  data?: {
    product: {
      id: number;
      name: string;
      category: string;
      unit: string;
      imageUrl?: string | null;
    };
    listing: {
      id: number;
      farmerId: number;
      productId: number;
      quantity: string;
      price: string;
      availableDate: Date;
      status: 'active' | 'sold' | 'expired';
      createdAt: Date;
      updatedAt: Date;
    };
  };
  error?: string;
}



export type CreateListingInput = z.infer<typeof createListingSchema>;
export type ProductWithListingInput = z.infer<typeof productWithListingSchema>;


// Export types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateFarmerInput = z.infer<typeof createFarmerSchema>;
export type UpdateFarmerInput = z.infer<typeof updateFarmerSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductFilter = z.infer<typeof productFilterSchema>;
export type CreateLogisticsInput = z.infer<typeof logisticsSchema>;
export type LogisticsStatus = "scheduled" | "in_progress" | "completed";
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type RelatedPostsInput = z.infer<typeof relatedPostsSchema>;
export type CreateRatingInput = z.infer<typeof createRatingSchema>;
export type UpdateRatingInput = z.infer<typeof updateRatingSchema>;
export type CreateBuyerInput = z.infer<typeof createBuyerSchema>;
export type UpdateBuyerInput = z.infer<typeof updateBuyerSchema>;