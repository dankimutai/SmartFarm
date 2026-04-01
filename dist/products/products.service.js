"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../drizzle/db");
const schema_1 = require("../drizzle/schema");
exports.productService = {
    // ✅ Get all products
    getAll: async () => {
        return await db_1.db.query.products.findMany();
    },
    // ✅ Get product by ID
    getById: async (id) => {
        return await db_1.db.query.products.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.products.id, id) }) ?? null;
    },
    // ✅ Create new product
    create: async (data) => {
        const [newProduct] = await db_1.db.insert(schema_1.products).values(data).returning();
        return newProduct;
    },
    // ✅ Update product
    update: async (id, data) => {
        const [updatedProduct] = await db_1.db
            .update(schema_1.products)
            .set(data)
            .where((0, drizzle_orm_1.eq)(schema_1.products.id, id))
            .returning();
        return updatedProduct ?? null;
    },
    // ✅ Delete product
    delete: async (id) => {
        const [deletedProduct] = await db_1.db
            .delete(schema_1.products)
            .where((0, drizzle_orm_1.eq)(schema_1.products.id, id))
            .returning();
        return deletedProduct ?? null;
    },
    // ✅ Search products with filters
    search: async (filters) => {
        const { name, category, minListings } = filters;
        // Initialize conditions array
        const conditions = [];
        // Apply search filters dynamically
        if (name) {
            conditions.push((0, drizzle_orm_1.like)(schema_1.products.name, `%${name}%`));
        }
        if (category) {
            conditions.push((0, drizzle_orm_1.like)(schema_1.products.category, `%${category}%`));
        }
        if (minListings) {
            const subquery = db_1.db
                .select({ total: (0, drizzle_orm_1.count)() })
                .from(schema_1.listings)
                .where((0, drizzle_orm_1.eq)(schema_1.listings.productId, schema_1.products.id));
            conditions.push((0, drizzle_orm_1.gt)(subquery.as("listingsCount"), minListings));
        }
        // Execute query dynamically (NO direct modification of `query` object)
        try {
            const result = await db_1.db
                .select({
                id: schema_1.products.id,
                name: schema_1.products.name,
                category: schema_1.products.category,
                unit: schema_1.products.unit,
                imageUrl: schema_1.products.imageUrl,
            })
                .from(schema_1.products)
                .where((0, drizzle_orm_1.and)(...conditions)) // ✅ Apply conditions dynamically
                .execute(); // ✅ Ensure query is executed
            console.log("Search Results:", result);
            return result;
        }
        catch (error) {
            console.error("Error executing search query:", error);
            throw new Error("Database query execution failed");
        }
    },
    // ✅ Get product with active listings
    getWithListings: async (id) => {
        return await db_1.db.query.products.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.products.id, id),
            with: {
                listings: {
                    where: (0, drizzle_orm_1.eq)(schema_1.listings.status, "active"),
                    columns: {
                        id: true,
                        quantity: true,
                        price: true,
                        availableDate: true,
                    },
                },
            },
        });
    },
    // ✅ Get paginated products
    getPaginated: async (page, pageSize = 10) => {
        const offset = (page - 1) * pageSize;
        const [data, total] = await Promise.all([
            db_1.db.query.products.findMany({
                limit: pageSize,
                offset: offset,
            }),
            db_1.db.query.products.findMany({}).then((res) => ({ count: res.length })),
        ]);
        return {
            data,
            total: total.count,
            page,
            pageSize,
        };
    },
    //getAll With Listings
    getAllWithListings: async () => {
        try {
            return await db_1.db.query.products.findMany({
                columns: {
                    id: true,
                    name: true,
                    category: true,
                    unit: true,
                    imageUrl: true,
                },
                with: {
                    listings: {
                        where: (0, drizzle_orm_1.eq)(schema_1.listings.status, "active"),
                        columns: {
                            id: true,
                            quantity: true,
                            price: true,
                            availableDate: true,
                        },
                    },
                },
            });
        }
        catch (error) {
            console.error("Error fetching products with listings:", error);
            throw new Error("Failed to fetch products with listings");
        }
    },
};
