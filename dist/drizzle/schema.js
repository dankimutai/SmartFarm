"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionRelations = exports.ratingsRelations = exports.knowledgeSharingUserRelations = exports.orderLogisticsRelations = exports.orderPaymentRelations = exports.productsRelations = exports.buyerOrdersRelations = exports.farmerCropRelations = exports.listingsRelations = exports.orderRelations = exports.farmerListingsRelations = exports.userRoleRelations = exports.buyerRelations = exports.farmerCropsRelations = exports.farmerRelations = exports.userRelations = exports.ratings = exports.knowledgeSharing = exports.logistics = exports.transactions = exports.orders = exports.listings = exports.products = exports.buyers = exports.farmerCrops = exports.farmers = exports.users = exports.logisticsStatusEnum = exports.paymentStatusEnum = exports.orderStatusEnum = exports.listingStatusEnum = exports.roleEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_2 = require("drizzle-orm/pg-core");
// Enums
exports.roleEnum = (0, pg_core_1.pgEnum)("roleEnum", ["farmer", "buyer", "admin"]);
exports.listingStatusEnum = (0, pg_core_1.pgEnum)("listingStatusEnum", ["active", "sold", "expired"]);
exports.orderStatusEnum = (0, pg_core_1.pgEnum)("orderStatusEnum", ["pending", "confirmed", "in_transit", "delivered", "cancelled"]);
exports.paymentStatusEnum = (0, pg_core_1.pgEnum)("paymentStatusEnum", ["pending", "paid", "failed"]);
exports.logisticsStatusEnum = (0, pg_core_1.pgEnum)("logisticsStatusEnum", ["scheduled", "in_progress", "completed"]);
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    email: (0, pg_core_1.text)("email").unique().notNull(),
    phoneNumber: (0, pg_core_1.varchar)("phone_number", { length: 20 }).notNull(),
    password: (0, pg_core_1.varchar)("password", { length: 255 }).notNull(),
    image: (0, pg_core_1.varchar)("image", { length: 255 }),
    role: (0, exports.roleEnum)("role").default("farmer"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.farmers = (0, pg_core_1.pgTable)("farmers", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id")
        .references(() => exports.users.id, { onDelete: "cascade" })
        .unique()
        .notNull(),
    location: (0, pg_core_1.text)("location").notNull(),
    farmSize: (0, pg_core_1.decimal)("farm_size", { precision: 10, scale: 2 }), // Added precision and scale
    primaryCrops: (0, pg_core_1.text)("primary_crops"),
});
exports.farmerCrops = (0, pg_core_1.pgTable)("farmer_crops", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    farmerId: (0, pg_core_1.integer)("farmer_id")
        .references(() => exports.farmers.id, { onDelete: "cascade" })
        .notNull(),
    cropName: (0, pg_core_1.text)("crop_name").notNull(),
});
exports.buyers = (0, pg_core_1.pgTable)("buyers", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id")
        .references(() => exports.users.id, { onDelete: "cascade" })
        .unique()
        .notNull(),
    companyName: (0, pg_core_1.text)("company_name"),
    businessType: (0, pg_core_1.text)("business_type"),
});
exports.products = (0, pg_core_1.pgTable)("products", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    category: (0, pg_core_1.text)("category").notNull(),
    unit: (0, pg_core_1.text)("unit").notNull(), // kg, ton, etc.
    imageUrl: (0, pg_core_1.varchar)("image_url", { length: 255 }),
});
exports.listings = (0, pg_core_1.pgTable)("listings", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    farmerId: (0, pg_core_1.integer)("farmer_id")
        .references(() => exports.farmers.id, { onDelete: "cascade" })
        .notNull(),
    productId: (0, pg_core_1.integer)("product_id")
        .references(() => exports.products.id, { onDelete: "cascade" })
        .notNull(),
    quantity: (0, pg_core_1.decimal)("quantity", { precision: 10, scale: 2 }).notNull(), // Changed to decimal with precision
    price: (0, pg_core_1.decimal)("price", { precision: 10, scale: 2 }).notNull(),
    availableDate: (0, pg_core_1.timestamp)("available_date").notNull(), // Removed mode: "string"
    status: (0, exports.listingStatusEnum)("status").default("active"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.orders = (0, pg_core_1.pgTable)("orders", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    buyerId: (0, pg_core_1.integer)("buyer_id")
        .references(() => exports.buyers.id, { onDelete: "cascade" })
        .notNull(),
    listingId: (0, pg_core_1.integer)("listing_id")
        .references(() => exports.listings.id, { onDelete: "cascade" })
        .notNull(),
    quantity: (0, pg_core_1.decimal)("quantity", { precision: 10, scale: 2 }).notNull(),
    totalPrice: (0, pg_core_1.decimal)("total_price", { precision: 10, scale: 2 }).notNull(),
    orderStatus: (0, exports.orderStatusEnum)("order_status").default("pending"),
    paymentStatus: (0, exports.paymentStatusEnum)("payment_status").default("pending"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.transactions = (0, pg_core_1.pgTable)("transactions", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    orderId: (0, pg_core_1.integer)("order_id")
        .references(() => exports.orders.id, { onDelete: "cascade" })
        .notNull(),
    amount: (0, pg_core_1.decimal)("amount").notNull(),
    currency: (0, pg_core_1.text)("currency").default("KES"),
    paymentMethod: (0, pg_core_1.text)("payment_method").notNull(),
    status: (0, exports.paymentStatusEnum)("status").default("pending"),
    providerTransactionId: (0, pg_core_1.text)("provider_transaction_id"),
    providerTransactionDate: (0, pg_core_1.timestamp)("provider_transaction_date"),
    metadata: (0, pg_core_2.jsonb)("metadata"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.logistics = (0, pg_core_1.pgTable)("logistics", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    orderId: (0, pg_core_1.integer)("order_id")
        .references(() => exports.orders.id, { onDelete: "cascade" })
        .notNull(),
    pickupLocation: (0, pg_core_1.text)("pickup_location").notNull(),
    deliveryLocation: (0, pg_core_1.text)("delivery_location").notNull(),
    status: (0, exports.logisticsStatusEnum)("status").default("in_progress"),
    estimatedDeliveryDate: (0, pg_core_1.timestamp)("estimated_delivery_date"),
    actualDeliveryDate: (0, pg_core_1.timestamp)("actual_delivery_date"),
    deliveredAt: (0, pg_core_1.timestamp)("delivered_at"),
});
exports.knowledgeSharing = (0, pg_core_1.pgTable)("knowledge_sharing", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    authorId: (0, pg_core_1.integer)("author_id")
        .references(() => exports.users.id, { onDelete: "cascade" })
        .notNull(),
    title: (0, pg_core_1.text)("title").notNull(),
    content: (0, pg_core_1.text)("content").notNull(),
    category: (0, pg_core_1.text)("category").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.ratings = (0, pg_core_1.pgTable)("ratings", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    raterId: (0, pg_core_1.integer)("rater_id")
        .references(() => exports.users.id, { onDelete: "cascade" })
        .notNull(),
    ratedId: (0, pg_core_1.integer)("rated_id")
        .references(() => exports.users.id, { onDelete: "cascade" })
        .notNull(),
    orderId: (0, pg_core_1.integer)("order_id")
        .references(() => exports.orders.id, { onDelete: "cascade" })
        .notNull(),
    rating: (0, pg_core_1.integer)("rating").notNull(),
    comment: (0, pg_core_1.text)("comment"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
//Relationships
// Relations - Removed duplicates and fixed definitions
exports.userRelations = (0, drizzle_orm_1.relations)(exports.users, ({ one }) => ({
    farmer: one(exports.farmers, { fields: [exports.users.id], references: [exports.farmers.userId] }),
    buyer: one(exports.buyers, { fields: [exports.users.id], references: [exports.buyers.userId] }),
}));
exports.farmerRelations = (0, drizzle_orm_1.relations)(exports.farmers, ({ one, many }) => ({
    // Relation to user
    user: one(exports.users, {
        fields: [exports.farmers.userId],
        references: [exports.users.id],
    }),
    // Relation to farmerCrops
    crops: many(exports.farmerCrops),
    // Relation to listings
    listings: many(exports.listings),
}));
exports.farmerCropsRelations = (0, drizzle_orm_1.relations)(exports.farmerCrops, ({ one }) => ({
    // Relation to farmer
    farmer: one(exports.farmers, {
        fields: [exports.farmerCrops.farmerId],
        references: [exports.farmers.id],
    }),
    // Optional relation to product if you want to track which products are grown
    product: one(exports.products, {
        fields: [exports.farmerCrops.cropName],
        references: [exports.products.name],
    }),
}));
exports.buyerRelations = (0, drizzle_orm_1.relations)(exports.buyers, ({ one, many }) => ({
    user: one(exports.users, { fields: [exports.buyers.userId], references: [exports.users.id] }),
    orders: many(exports.orders),
}));
exports.userRoleRelations = (0, drizzle_orm_1.relations)(exports.users, ({ one }) => ({
    farmer: one(exports.farmers, { fields: [exports.users.id], references: [exports.farmers.userId] }),
    buyer: one(exports.buyers, { fields: [exports.users.id], references: [exports.buyers.userId] }),
}));
exports.farmerListingsRelations = (0, drizzle_orm_1.relations)(exports.farmers, ({ many }) => ({
    listings: many(exports.listings),
}));
exports.orderRelations = (0, drizzle_orm_1.relations)(exports.orders, ({ one, many }) => ({
    buyer: one(exports.buyers, {
        fields: [exports.orders.buyerId],
        references: [exports.buyers.id],
    }),
    listing: one(exports.listings, {
        fields: [exports.orders.listingId],
        references: [exports.listings.id],
    }),
    payment: many(exports.transactions),
    logistics: one(exports.logistics, {
        fields: [exports.orders.id],
        references: [exports.logistics.orderId],
    }),
}));
// Update the listings relations to include orders
// Listings Relations
exports.listingsRelations = (0, drizzle_orm_1.relations)(exports.listings, ({ one, many }) => ({
    // Relation to farmer
    farmer: one(exports.farmers, {
        fields: [exports.listings.farmerId],
        references: [exports.farmers.id],
    }),
    // Relation to product
    product: one(exports.products, {
        fields: [exports.listings.productId],
        references: [exports.products.id],
    }),
    // Relation to orders
    orders: many(exports.orders),
}));
exports.farmerCropRelations = (0, drizzle_orm_1.relations)(exports.farmerCrops, ({ one }) => ({
    farmer: one(exports.farmers, {
        fields: [exports.farmerCrops.farmerId],
        references: [exports.farmers.id],
    }),
}));
exports.buyerOrdersRelations = (0, drizzle_orm_1.relations)(exports.buyers, ({ many }) => ({
    orders: many(exports.orders),
}));
exports.productsRelations = (0, drizzle_orm_1.relations)(exports.products, ({ many }) => ({
    // Relation to listings
    listings: many(exports.listings),
    // Relation to farmerCrops
    farmerCrops: many(exports.farmerCrops),
}));
exports.orderPaymentRelations = (0, drizzle_orm_1.relations)(exports.orders, ({ many }) => ({
    payments: many(exports.transactions),
}));
exports.orderLogisticsRelations = (0, drizzle_orm_1.relations)(exports.orders, ({ one }) => ({
    logistics: one(exports.logistics, {
        fields: [exports.orders.id],
        references: [exports.logistics.orderId],
    }),
}));
exports.knowledgeSharingUserRelations = (0, drizzle_orm_1.relations)(exports.knowledgeSharing, ({ one }) => ({
    author: one(exports.users, {
        fields: [exports.knowledgeSharing.authorId],
        references: [exports.users.id],
    }),
}));
exports.ratingsRelations = (0, drizzle_orm_1.relations)(exports.ratings, ({ one }) => ({
    rater: one(exports.users, { fields: [exports.ratings.raterId], references: [exports.users.id] }),
    rated: one(exports.users, { fields: [exports.ratings.ratedId], references: [exports.users.id] }),
    order: one(exports.orders, { fields: [exports.ratings.orderId], references: [exports.orders.id] }),
}));
exports.transactionRelations = (0, drizzle_orm_1.relations)(exports.transactions, ({ one }) => ({
    order: one(exports.orders, {
        fields: [exports.transactions.orderId],
        references: [exports.orders.id],
    }),
}));
