import { Hono } from "hono";
import { 
  getAllListings,
  getListing, 
  createListing,
  updateListing,
  deleteListing,
  updateListingStatus,
  getFarmerListings,
  createProductWithListing
} from "./listings.controller";
import { zValidator } from "@hono/zod-validator";
import { listingSchema } from "../validators/validator";
import { listings } from "../drizzle/schema";
import { productWithListingSchema } from "../validators/validator";

export const listingsRouter = new Hono();

// General listings routes
listingsRouter.get("/listings", getAllListings);

// Farmer-specific route
listingsRouter.get("/listings/farmer/:farmerId", getFarmerListings);

// Specific listing routes
listingsRouter.get("/listings/:id", getListing);
listingsRouter.post("/listings", zValidator('json',listingSchema), createListing);
listingsRouter.put("/listings/:id", zValidator('json',listingSchema), updateListing);
listingsRouter.delete("/listings/:id", deleteListing);
listingsRouter.patch("/listings/:id", updateListingStatus);

listingsRouter.post(
    "/product-listings", 
    zValidator('json', productWithListingSchema), 
    createProductWithListing
  );