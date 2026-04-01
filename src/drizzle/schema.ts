import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  pgEnum,
  integer,
  decimal,
  numeric,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { jsonb } from "drizzle-orm/pg-core";
import { number } from "zod";

// Enums
export const roleEnum = pgEnum("roleEnum", ["farmer", "buyer", "admin"]);
export const listingStatusEnum = pgEnum("listingStatusEnum", ["active", "sold", "expired"]);
export const orderStatusEnum = pgEnum("orderStatusEnum", ["pending", "confirmed", "in_transit", "delivered", "cancelled"]);
export const paymentStatusEnum = pgEnum("paymentStatusEnum", ["pending", "paid", "failed"]);
export const logisticsStatusEnum = pgEnum("logisticsStatusEnum", ["scheduled", "in_progress", "completed"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  image: varchar("image", { length: 255 }),
  role: roleEnum("role").default("farmer"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const farmers = pgTable("farmers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  location: text("location").notNull(),
  farmSize: decimal("farm_size", { precision: 10, scale: 2 }), // Added precision and scale
  primaryCrops: text("primary_crops"),
});

export const farmerCrops = pgTable("farmer_crops", {
  id: serial("id").primaryKey(),
  farmerId: integer("farmer_id")
    .references(() => farmers.id, { onDelete: "cascade" })
    .notNull(),
  cropName: text("crop_name").notNull(),
});

export const buyers = pgTable("buyers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  companyName: text("company_name"),
  businessType: text("business_type"),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  unit: text("unit").notNull(), // kg, ton, etc.
  imageUrl: varchar("image_url", { length: 255 }),
});

export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  farmerId: integer("farmer_id")
    .references(() => farmers.id, { onDelete: "cascade" })
    .notNull(),
  productId: integer("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(), // Changed to decimal with precision
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  availableDate: timestamp("available_date").notNull(), // Removed mode: "string"
  status: listingStatusEnum("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyer_id")
    .references(() => buyers.id, { onDelete: "cascade" })
    .notNull(),
  listingId: integer("listing_id")
    .references(() => listings.id, { onDelete: "cascade" })
    .notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  orderStatus: orderStatusEnum("order_status").default("pending"),
  paymentStatus: paymentStatusEnum("payment_status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .references(() => orders.id, { onDelete: "cascade" })
    .notNull(),
  amount: decimal("amount").notNull(),
  currency: text("currency").default("KES"),
  paymentMethod: text("payment_method").notNull(),
  status: paymentStatusEnum("status").default("pending"),
  providerTransactionId: text("provider_transaction_id"),
  providerTransactionDate: timestamp("provider_transaction_date"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const logistics = pgTable("logistics", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .references(() => orders.id, { onDelete: "cascade" })
    .notNull(),
  pickupLocation: text("pickup_location").notNull(),
  deliveryLocation: text("delivery_location").notNull(),
  status: logisticsStatusEnum("status").default("in_progress"),
  estimatedDeliveryDate: timestamp("estimated_delivery_date"),
  actualDeliveryDate: timestamp("actual_delivery_date"),
  deliveredAt: timestamp("delivered_at"),
});

export const knowledgeSharing = pgTable("knowledge_sharing", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  raterId: integer("rater_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  ratedId: integer("rated_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  orderId: integer("order_id")
    .references(() => orders.id, { onDelete: "cascade" })
    .notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

//Relationships

// Relations - Removed duplicates and fixed definitions
export const userRelations = relations(users, ({ one }) => ({
  farmer: one(farmers, { fields: [users.id], references: [farmers.userId] }),
  buyer: one(buyers, { fields: [users.id], references: [buyers.userId] }),
}));

export const farmerRelations = relations(farmers, ({ one, many }) => ({
  // Relation to user
  user: one(users, {
    fields: [farmers.userId],
    references: [users.id],
  }),
  // Relation to farmerCrops
  crops: many(farmerCrops),
  // Relation to listings
  listings: many(listings),
}));

export const farmerCropsRelations = relations(farmerCrops, ({ one }) => ({
  // Relation to farmer
  farmer: one(farmers, {
    fields: [farmerCrops.farmerId],
    references: [farmers.id],
  }),
  // Optional relation to product if you want to track which products are grown
  product: one(products, {
    fields: [farmerCrops.cropName],
    references: [products.name],
  }),
}));






export const buyerRelations = relations(buyers, ({ one, many }) => ({
  user: one(users, { fields: [buyers.userId], references: [users.id] }),
  orders: many(orders),
}));

export const userRoleRelations = relations(users, ({ one }) => ({
  farmer: one(farmers, { fields: [users.id], references: [farmers.userId] }),
  buyer: one(buyers, { fields: [users.id], references: [buyers.userId] }),
}));



export const farmerListingsRelations = relations(farmers, ({ many }) => ({
  listings: many(listings),
}));




export const orderRelations = relations(orders, ({ one, many }) => ({
  buyer: one(buyers, {
    fields: [orders.buyerId],
    references: [buyers.id],
  }),
  listing: one(listings, {
    fields: [orders.listingId],
    references: [listings.id],
  }),
  payment: many(transactions),
  logistics: one(logistics, {
    fields: [orders.id],
    references: [logistics.orderId],
  }),
}));

// Update the listings relations to include orders
// Listings Relations
export const listingsRelations = relations(listings, ({ one, many }) => ({
  // Relation to farmer
  farmer: one(farmers, {
    fields: [listings.farmerId],
    references: [farmers.id],
  }),
  // Relation to product
  product: one(products, {
    fields: [listings.productId],
    references: [products.id],
  }),
  // Relation to orders
  orders: many(orders),
}));




export const farmerCropRelations = relations(farmerCrops, ({ one }) => ({
  farmer: one(farmers, {
    fields: [farmerCrops.farmerId],
    references: [farmers.id],
  }),
}));



export const buyerOrdersRelations = relations(buyers, ({ many }) => ({
  orders: many(orders),
}));

export const productsRelations = relations(products, ({ many }) => ({
  // Relation to listings
  listings: many(listings),
  // Relation to farmerCrops
  farmerCrops: many(farmerCrops),
}));





export const orderPaymentRelations = relations(orders, ({ many }) => ({
  payments: many(transactions),
}));

export const orderLogisticsRelations = relations(orders, ({ one }) => ({
  logistics: one(logistics, {
    fields: [orders.id],
    references: [logistics.orderId],
  }),
}));

export const knowledgeSharingUserRelations = relations(
  knowledgeSharing,
  ({ one }) => ({
    author: one(users, {
      fields: [knowledgeSharing.authorId],
      references: [users.id],
    }),
  })
);

export const ratingsRelations = relations(ratings, ({ one }) => ({
  rater: one(users, { fields: [ratings.raterId], references: [users.id] }),
  rated: one(users, { fields: [ratings.ratedId], references: [users.id] }),
  order: one(orders, { fields: [ratings.orderId], references: [orders.id] }),
}));

export const transactionRelations = relations(transactions, ({ one }) => ({
  order: one(orders, {
    fields: [transactions.orderId],
    references: [orders.id],
  }),
}));


// Users
export type TIUsers = typeof users.$inferInsert; // Type for inserting new users
export type TSUsers = typeof users.$inferSelect; // Type for selecting users

// Farmers
export type TIFarmers = typeof farmers.$inferInsert;
export type TSFarmers = typeof farmers.$inferSelect;

// Buyers
export type TIBuyers = typeof buyers.$inferInsert;
export type TSBuyers = typeof buyers.$inferSelect;

// Products
export type TIProducts = typeof products.$inferInsert;
export type TSProducts = typeof products.$inferSelect;

// Listings
export type TIListings = typeof listings.$inferInsert;
export type TSListings = typeof listings.$inferSelect;

// Orders
export type TIOrders = typeof orders.$inferInsert;
export type TSOrders = typeof orders.$inferSelect;

// Transactions
export type TITransactions = typeof transactions.$inferInsert;
export type TSTransactions = typeof transactions.$inferSelect;

// Logistics
export type TILogistics = typeof logistics.$inferInsert;
export type TSLogistics = typeof logistics.$inferSelect;

// Knowledge Sharing
export type TIKnowledgeSharing = typeof knowledgeSharing.$inferInsert;
export type TSKnowledgeSharing = typeof knowledgeSharing.$inferSelect;

// Ratings
export type TIRatings = typeof ratings.$inferInsert;
export type TSRatings = typeof ratings.$inferSelect;
