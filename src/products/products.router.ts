import { Hono } from "hono";
import { productController } from "./products.controller";
import {
  createProductSchema,
  updateProductSchema,
  productFilterSchema,
} from "../validators/validator";
import { zValidator } from "@hono/zod-validator";
import { allRolesAuth } from "../middleware/auth.middleware";

export const productRouter = new Hono();

productRouter.get(
  "/products/search",
  zValidator("query", productFilterSchema),
  productController.search
);

productRouter.get("/products/with-listings", productController.getAllWithListings);
productRouter.get("/products", productController.getAll);
productRouter.get("/products/:id", productController.getById);
productRouter.get("/products/:id/listings", productController.getWithListings);
productRouter.get("/products/paginated", productController.getPaginated);

productRouter.post(
  "/products",
  allRolesAuth,
  zValidator("json", createProductSchema),
  productController.create
);
productRouter.put(
  "/products/:id",
  allRolesAuth,
  zValidator("json", updateProductSchema),
  productController.update
);
productRouter.delete("/products/:id", allRolesAuth, productController.delete);

export default productRouter;