"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listingsRouter = void 0;
const hono_1 = require("hono");
const listings_controller_1 = require("./listings.controller");
const zod_validator_1 = require("@hono/zod-validator");
const validator_1 = require("../validators/validator");
const validator_2 = require("../validators/validator");
exports.listingsRouter = new hono_1.Hono();
// General listings routes
exports.listingsRouter.get("/listings", listings_controller_1.getAllListings);
// Farmer-specific route
exports.listingsRouter.get("/listings/farmer/:farmerId", listings_controller_1.getFarmerListings);
// Specific listing routes
exports.listingsRouter.get("/listings/:id", listings_controller_1.getListing);
exports.listingsRouter.post("/listings", (0, zod_validator_1.zValidator)('json', validator_1.listingSchema), listings_controller_1.createListing);
exports.listingsRouter.put("/listings/:id", (0, zod_validator_1.zValidator)('json', validator_1.listingSchema), listings_controller_1.updateListing);
exports.listingsRouter.delete("/listings/:id", listings_controller_1.deleteListing);
exports.listingsRouter.patch("/listings/:id", listings_controller_1.updateListingStatus);
exports.listingsRouter.post("/product-listings", (0, zod_validator_1.zValidator)('json', validator_2.productWithListingSchema), listings_controller_1.createProductWithListing);
