"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productController = void 0;
const products_service_1 = require("./products.service");
exports.productController = {
    // ✅ Get all products
    getAll: async (ctx) => {
        try {
            const products = await products_service_1.productService.getAll();
            return ctx.json({ success: true, data: formatProducts(products) });
        }
        catch (error) {
            return handleError(ctx, error);
        }
    },
    // ✅ Get product by ID
    getById: async (ctx) => {
        try {
            const id = parseId(ctx.req.param("id"));
            if (id === null)
                return invalidIdResponse(ctx);
            const product = await products_service_1.productService.getById(id);
            if (!product)
                return notFoundResponse(ctx, "Product not found");
            return ctx.json({ success: true, data: formatProduct(product) });
        }
        catch (error) {
            return handleError(ctx, error);
        }
    },
    // ✅ Create new product
    create: async (ctx) => {
        try {
            const data = await ctx.req.json();
            const newProduct = await products_service_1.productService.create(data);
            return ctx.json({ success: true, data: formatProduct(newProduct) }, 201);
        }
        catch (error) {
            return handleError(ctx, error);
        }
    },
    // ✅ Update product
    update: async (ctx) => {
        try {
            const id = parseId(ctx.req.param("id"));
            if (id === null)
                return invalidIdResponse(ctx);
            const data = await ctx.req.json();
            const updatedProduct = await products_service_1.productService.update(id, data);
            if (!updatedProduct)
                return notFoundResponse(ctx, "Product not found");
            return ctx.json({ success: true, data: formatProduct(updatedProduct) });
        }
        catch (error) {
            return handleError(ctx, error);
        }
    },
    // ✅ Delete product
    delete: async (ctx) => {
        try {
            const id = parseId(ctx.req.param("id"));
            if (id === null)
                return invalidIdResponse(ctx);
            const deletedProduct = await products_service_1.productService.delete(id);
            if (!deletedProduct)
                return notFoundResponse(ctx, "Product not found");
            return ctx.json({
                success: true,
                message: "Product deleted successfully",
            });
        }
        catch (error) {
            return handleError(ctx, error);
        }
    },
    // ✅ Search products with filters
    search: async (ctx) => {
        try {
            const filters = {
                name: ctx.req.query("name") ?? "", // Ensure it's always a string
                category: ctx.req.query("category") ?? "", // Default empty string if undefined
                minListings: ctx.req.query("minListings")
                    ? Number(ctx.req.query("minListings"))
                    : undefined, // Convert to number or keep undefined
            };
            console.log("Received Search Filters:", filters); // Debugging log
            const products = await products_service_1.productService.search(filters);
            return ctx.json({
                success: true,
                data: products,
            });
        }
        catch (error) {
            console.error("Search Error:", error.message);
            return ctx.json({ success: false, error: "Failed to search products" }, 500);
        }
    },
    // ✅ Get product with active listings
    getWithListings: async (ctx) => {
        try {
            const id = parseId(ctx.req.param("id"));
            if (id === null)
                return invalidIdResponse(ctx);
            const product = await products_service_1.productService.getWithListings(id);
            if (!product)
                return notFoundResponse(ctx, "Product not found");
            return ctx.json({
                success: true,
                data: formatProductWithListings(product),
            });
        }
        catch (error) {
            return handleError(ctx, error);
        }
    },
    // ✅ Get paginated products
    getPaginated: async (ctx) => {
        try {
            // ✅ Extract query params safely with default values
            const page = parseInt(ctx.req.query("page") ?? "1", 10);
            const pageSize = parseInt(ctx.req.query("pageSize") ?? "10", 10);
            // ✅ Ensure page and pageSize are valid numbers
            if (isNaN(page) || page < 1)
                return ctx.json({ success: false, error: "Invalid page number" }, 400);
            if (isNaN(pageSize) || pageSize < 1)
                return ctx.json({ success: false, error: "Invalid page size" }, 400);
            const result = await products_service_1.productService.getPaginated(page, pageSize);
            return ctx.json({
                success: true,
                data: { ...result, data: formatProducts(result.data) },
            });
        }
        catch (error) {
            return handleError(ctx, error);
        }
    },
    // ✅ Get all products with their active listings
    getAllWithListings: async (ctx) => {
        try {
            const products = await products_service_1.productService.getAllWithListings();
            return ctx.json({
                success: true,
                data: products.map(formatProductWithListings),
            });
        }
        catch (error) {
            return handleError(ctx, error);
        }
    },
};
// ✅ Response formatting helpers
const formatProduct = (product) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    unit: product.unit,
    imageUrl: product.imageUrl,
});
const formatProducts = (products) => products.map(formatProduct);
const formatProductWithListings = (product) => ({
    ...formatProduct(product),
    listings: product.listings.map((listing) => ({
        id: listing.id,
        quantity: listing.quantity,
        price: listing.price,
        availableDate: listing.availableDate,
    })),
});
// ✅ Error handling helpers
const handleError = (ctx, error) => ctx.json({ success: false, error: error.message }, 500);
const invalidIdResponse = (ctx) => ctx.json({ success: false, error: "Invalid product ID" }, 400);
const notFoundResponse = (ctx, message) => ctx.json({ success: false, error: message }, 404);
// ✅ Utility function to parse ID safely
const parseId = (id) => id && !isNaN(Number(id)) ? Number(id) : null;
