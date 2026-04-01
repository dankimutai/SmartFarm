"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRouter = void 0;
const hono_1 = require("hono");
const products_controller_1 = require("./products.controller");
const validator_1 = require("../validators/validator");
const zod_validator_1 = require("@hono/zod-validator");
exports.productRouter = new hono_1.Hono();
// ✅ Advanced Features
exports.productRouter.get("/products/search", (0, zod_validator_1.zValidator)("query", validator_1.productFilterSchema), products_controller_1.productController.search); // Search products
// ✅ Basic CRUD Endpoints
exports.productRouter.get("/products/with-listings", products_controller_1.productController.getAllWithListings);
exports.productRouter.get("/products", products_controller_1.productController.getAll);
exports.productRouter.get("/products/:id", products_controller_1.productController.getById);
exports.productRouter.post("/products", (0, zod_validator_1.zValidator)("json", validator_1.createProductSchema), products_controller_1.productController.create); // Create product
exports.productRouter.put("/products/:id", (0, zod_validator_1.zValidator)("json", validator_1.updateProductSchema), products_controller_1.productController.update); // Update product
exports.productRouter.delete("/products/:id", products_controller_1.productController.delete); // Delete product
exports.productRouter.get("/products/:id/listings", products_controller_1.productController.getWithListings); // Get product with listings
exports.productRouter.get("/products/paginated", products_controller_1.productController.getPaginated); // Paginated products
exports.default = exports.productRouter;
