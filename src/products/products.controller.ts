import { Context } from "hono";
import { productService } from "./products.service";
import { TSProducts } from "../drizzle/schema";
import { productFilterSchema } from "../validators/validator"; // Import the schema
import { ProductFilter } from "../validators/validator";

export const productController = {
  // ✅ Get all products
  getAll: async (ctx: Context) => {
    try {
      const products = await productService.getAll();
      return ctx.json({ success: true, data: formatProducts(products) });
    } catch (error: any) {
      return handleError(ctx, error);
    }
  },

  // ✅ Get product by ID
  getById: async (ctx: Context) => {
    try {
      const id = parseId(ctx.req.param("id"));
      if (id === null) return invalidIdResponse(ctx);

      const product = await productService.getById(id);
      if (!product) return notFoundResponse(ctx, "Product not found");

      return ctx.json({ success: true, data: formatProduct(product) });
    } catch (error: any) {
      return handleError(ctx, error);
    }
  },

  // ✅ Create new product
  create: async (ctx: Context) => {
    try {
      const data = await ctx.req.json();
      const newProduct = await productService.create(data);
      return ctx.json({ success: true, data: formatProduct(newProduct) }, 201);
    } catch (error: any) {
      return handleError(ctx, error);
    }
  },

  // ✅ Update product
  update: async (ctx: Context) => {
    try {
      const id = parseId(ctx.req.param("id"));
      if (id === null) return invalidIdResponse(ctx);

      const data = await ctx.req.json();
      const updatedProduct = await productService.update(id, data);
      if (!updatedProduct) return notFoundResponse(ctx, "Product not found");

      return ctx.json({ success: true, data: formatProduct(updatedProduct) });
    } catch (error: any) {
      return handleError(ctx, error);
    }
  },

  // ✅ Delete product
  delete: async (ctx: Context) => {
    try {
      const id = parseId(ctx.req.param("id"));
      if (id === null) return invalidIdResponse(ctx);

      const deletedProduct = await productService.delete(id);
      if (!deletedProduct) return notFoundResponse(ctx, "Product not found");

      return ctx.json({
        success: true,
        message: "Product deleted successfully",
      });
    } catch (error: any) {
      return handleError(ctx, error);
    }
  },

  // ✅ Search products with filters
  search: async (ctx: Context) => {
    try {
      const filters: ProductFilter = {
        name: ctx.req.query("name") ?? "", // Ensure it's always a string
        category: ctx.req.query("category") ?? "", // Default empty string if undefined
        minListings: ctx.req.query("minListings")
          ? Number(ctx.req.query("minListings"))
          : undefined, // Convert to number or keep undefined
      };

      console.log("Received Search Filters:", filters); // Debugging log

      const products = await productService.search(filters);
      return ctx.json({
        success: true,
        data: products,
      });
    } catch (error: any) {
      console.error("Search Error:", error.message);
      return ctx.json(
        { success: false, error: "Failed to search products" },
        500
      );
    }
  },

  // ✅ Get product with active listings
  getWithListings: async (ctx: Context) => {
    try {
      const id = parseId(ctx.req.param("id"));
      if (id === null) return invalidIdResponse(ctx);

      const product = await productService.getWithListings(id);
      if (!product) return notFoundResponse(ctx, "Product not found");

      return ctx.json({
        success: true,
        data: formatProductWithListings(product),
      });
    } catch (error: any) {
      return handleError(ctx, error);
    }
  },

  // ✅ Get paginated products
  getPaginated: async (ctx: Context) => {
    try {
      // ✅ Extract query params safely with default values
      const page = parseInt(ctx.req.query("page") ?? "1", 10);
      const pageSize = parseInt(ctx.req.query("pageSize") ?? "10", 10);

      // ✅ Ensure page and pageSize are valid numbers
      if (isNaN(page) || page < 1)
        return ctx.json({ success: false, error: "Invalid page number" }, 400);
      if (isNaN(pageSize) || pageSize < 1)
        return ctx.json({ success: false, error: "Invalid page size" }, 400);

      const result = await productService.getPaginated(page, pageSize);

      return ctx.json({
        success: true,
        data: { ...result, data: formatProducts(result.data) },
      });
    } catch (error: any) {
      return handleError(ctx, error);
    }
  },
  // ✅ Get all products with their active listings
  getAllWithListings: async (ctx: Context) => {
    try {
      const products = await productService.getAllWithListings();

      return ctx.json({
        success: true,
        data: products.map(formatProductWithListings),
      });
    } catch (error: any) {
      return handleError(ctx, error);
    }
  },
};

// ✅ Response formatting helpers
const formatProduct = (product: TSProducts) => ({
  id: product.id,
  name: product.name,
  category: product.category,
  unit: product.unit,
  imageUrl: product.imageUrl,
});

const formatProducts = (products: TSProducts[]) => products.map(formatProduct);

const formatProductWithListings = (product: any) => ({
  ...formatProduct(product),
  listings: product.listings.map((listing: any) => ({
    id: listing.id,
    quantity: listing.quantity,
    price: listing.price,
    availableDate: listing.availableDate,
  })),
});

// ✅ Error handling helpers
const handleError = (ctx: Context, error: Error) =>
  ctx.json({ success: false, error: error.message }, 500);
const invalidIdResponse = (ctx: Context) =>
  ctx.json({ success: false, error: "Invalid product ID" }, 400);
const notFoundResponse = (ctx: Context, message: string) =>
  ctx.json({ success: false, error: message }, 404);

// ✅ Utility function to parse ID safely
const parseId = (id: string | undefined) =>
  id && !isNaN(Number(id)) ? Number(id) : null;
