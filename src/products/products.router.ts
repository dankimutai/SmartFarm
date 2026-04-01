import { Hono } from "hono";
import { productController } from "./products.controller";
import {
  createProductSchema,
  updateProductSchema,
  productFilterSchema,
} from "../validators/validator";
import { zValidator } from "@hono/zod-validator";

export const productRouter = new Hono();

// ✅ Advanced Features
productRouter.get(
  "/products/search",
  zValidator("query", productFilterSchema),
  productController.search
); // Search products

// ✅ Basic CRUD Endpoints
productRouter.get("/products/with-listings", productController.getAllWithListings); 
productRouter.get("/products", productController.getAll); 
productRouter.get("/products/:id", productController.getById); 
productRouter.post(
  "/products",
  zValidator("json", createProductSchema),
  productController.create
); // Create product
productRouter.put(
  "/products/:id",
  zValidator("json", updateProductSchema),
  productController.update
); // Update product
productRouter.delete("/products/:id", productController.delete); // Delete product


productRouter.get("/products/:id/listings", productController.getWithListings); // Get product with listings
productRouter.get("/products/paginated", productController.getPaginated); // Paginated products

export default productRouter;
