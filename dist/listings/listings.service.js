"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProductWithListingService = exports.getFarmerListingsService = exports.updateListingStatusService = exports.deleteListingService = exports.updateListingService = exports.createListingService = exports.getListingByIdService = exports.getListingsService = void 0;
const db_1 = require("../drizzle/db");
const schema_1 = require("../drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
const validator_1 = require("../validators/validator");
const getListingsService = async (limit) => {
    try {
        return await db_1.db.query.listings.findMany({
            limit,
            columns: {
                id: true,
                farmerId: true,
                productId: true,
                quantity: true,
                price: true,
                availableDate: true,
                status: true,
            },
            with: {
                farmer: {
                    columns: {
                        location: true,
                        farmSize: true,
                        primaryCrops: true,
                    }
                },
                product: {
                    columns: {
                        name: true,
                        category: true,
                        unit: true,
                        imageUrl: true,
                    }
                }
            },
        });
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error fetching listings: ${error.message}`);
        }
        throw new Error('Unknown error occurred while fetching listings');
    }
};
exports.getListingsService = getListingsService;
const getListingByIdService = async (id) => {
    try {
        const listing = await db_1.db.query.listings.findFirst({
            where: (listings, { eq }) => eq(listings.id, id),
            columns: {
                id: true,
                farmerId: true,
                productId: true,
                quantity: true,
                price: true,
                availableDate: true,
                status: true,
            },
            with: {
                farmer: {
                    columns: {
                        location: true,
                        farmSize: true,
                        primaryCrops: true,
                    }
                },
                product: {
                    columns: {
                        name: true,
                        category: true,
                        unit: true,
                        imageUrl: true,
                    }
                }
            },
        });
        if (!listing) {
            throw new Error('Listing not found');
        }
        return listing;
    }
    catch (error) {
        console.log(error);
        if (error instanceof Error) {
            throw new Error(`Error fetching listing: ${error.message}`);
        }
        throw new Error('Unknown error occurred while fetching listing');
    }
};
exports.getListingByIdService = getListingByIdService;
const createListingService = async (data) => {
    try {
        // Convert the date string to a Date object
        const listingData = {
            ...data,
            availableDate: new Date(data.availableDate),
        };
        const newListing = await db_1.db.insert(schema_1.listings).values(listingData).returning();
        return newListing[0];
    }
    catch (error) {
        throw new Error(error.message);
    }
};
exports.createListingService = createListingService;
const updateListingService = async (id, listing) => {
    try {
        const updatedListing = await db_1.db
            .update(schema_1.listings)
            .set({ ...listing, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.listings.id, id))
            .returning();
        return updatedListing[0];
    }
    catch (error) {
        throw new Error(error.message);
    }
};
exports.updateListingService = updateListingService;
const deleteListingService = async (id) => {
    try {
        const deletedListing = await db_1.db
            .delete(schema_1.listings)
            .where((0, drizzle_orm_1.eq)(schema_1.listings.id, id))
            .returning();
        return deletedListing[0];
    }
    catch (error) {
        throw new Error(error.message);
    }
};
exports.deleteListingService = deleteListingService;
const updateListingStatusService = async (id, status) => {
    try {
        const updatedListing = await db_1.db
            .update(schema_1.listings)
            .set({ status, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.listings.id, id))
            .returning();
        return updatedListing[0];
    }
    catch (error) {
        throw new Error(error.message);
    }
};
exports.updateListingStatusService = updateListingStatusService;
const getFarmerListingsService = async (farmerId) => {
    try {
        const farmersListings = await db_1.db.query.listings.findMany({
            where: (listings, { eq }) => eq(listings.farmerId, farmerId),
            columns: {
                id: true,
                productId: true,
                quantity: true,
                price: true,
                availableDate: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
            with: {
                product: {
                    columns: {
                        id: true,
                        name: true,
                        category: true,
                        unit: true,
                        imageUrl: true,
                    }
                }
            },
            orderBy: (listings, { desc }) => [desc(listings.createdAt)]
        });
        if (!farmersListings.length) {
            return [];
        }
        return farmersListings;
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error fetching farmer listings: ${error.message}`);
        }
        throw new Error('Unknown error occurred while fetching farmer listings');
    }
};
exports.getFarmerListingsService = getFarmerListingsService;
const createProductWithListingService = async (data) => {
    try {
        // 1. Validate input data
        const validatedData = validator_1.productWithListingSchema.parse(data);
        // 2. Create product
        const [newProduct] = await db_1.db
            .insert(schema_1.products)
            .values({
            name: validatedData.product.name,
            category: validatedData.product.category,
            unit: validatedData.product.unit,
            imageUrl: validatedData.product.imageUrl || null
        })
            .returning();
        if (!newProduct) {
            return {
                success: false,
                error: 'Failed to create product'
            };
        }
        // 3. Create listing using the product ID
        const [newListing] = await db_1.db
            .insert(schema_1.listings)
            .values({
            farmerId: validatedData.listing.farmerId,
            productId: newProduct.id,
            quantity: validatedData.listing.quantity.toString(),
            price: validatedData.listing.price.toString(),
            availableDate: new Date(validatedData.listing.availableDate),
            status: 'active' // Use const assertion to fix type
        })
            .returning();
        if (!newListing) {
            // Clean up by deleting the product if listing creation fails
            await db_1.db
                .delete(schema_1.products)
                .where((0, drizzle_orm_1.eq)(schema_1.products.id, newProduct.id));
            return {
                success: false,
                error: 'Failed to create listing'
            };
        }
        // 4. Fetch the complete listing with product details
        const completeData = await db_1.db.query.listings.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.listings.id, newListing.id),
            with: {
                product: true
            }
        });
        if (!completeData) {
            return {
                success: false,
                error: 'Failed to fetch complete listing data'
            };
        }
        // 5. Map the data to ensure it matches expected types
        const formattedListing = {
            id: completeData.id,
            farmerId: completeData.farmerId,
            productId: completeData.productId,
            quantity: completeData.quantity,
            price: completeData.price,
            availableDate: completeData.availableDate,
            status: (completeData.status || 'active'),
            createdAt: completeData.createdAt || new Date(),
            updatedAt: completeData.updatedAt || new Date()
        };
        // Return successful response with created data
        return {
            success: true,
            data: {
                product: newProduct,
                listing: formattedListing
            }
        };
    }
    catch (error) {
        if (error instanceof Error) {
            return {
                success: false,
                error: `Error creating product with listing: ${error.message}`
            };
        }
        return {
            success: false,
            error: 'Unknown error occurred while creating product with listing'
        };
    }
};
exports.createProductWithListingService = createProductWithListingService;
