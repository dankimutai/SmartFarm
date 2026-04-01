"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProductWithListing = exports.getFarmerListings = exports.updateListingStatus = exports.deleteListing = exports.updateListing = exports.createListing = exports.getListing = exports.getAllListings = void 0;
const listings_service_1 = require("./listings.service");
const validator_1 = require("../validators/validator");
const validator_2 = require("../validators/validator");
const getAllListings = async (c) => {
    try {
        const limit = Number(c.req.query('limit'));
        const listings = await (0, listings_service_1.getListingsService)(limit);
        if (!listings || listings.length === 0) {
            return c.json({
                success: false,
                message: 'No listings found'
            }, 404);
        }
        return c.json({
            success: true,
            data: listings
        }, 200);
    }
    catch (error) {
        if (error instanceof Error) {
            return c.json({
                success: false,
                error: error.message
            }, 400);
        }
        return c.json({
            success: false,
            error: 'An unknown error occurred'
        }, 500);
    }
};
exports.getAllListings = getAllListings;
const getListing = async (c) => {
    try {
        const id = parseInt(c.req.param('id'));
        if (isNaN(id)) {
            return c.json({
                success: false,
                error: 'Invalid ID provided'
            }, 400);
        }
        const listing = await (0, listings_service_1.getListingByIdService)(id);
        if (!listing) {
            return c.json({
                success: false,
                message: 'Listing not found'
            }, 404);
        }
        return c.json({
            success: true,
            data: listing
        }, 200);
    }
    catch (error) {
        if (error instanceof Error) {
            return c.json({
                success: false,
                error: error.message
            }, 400);
        }
        return c.json({
            success: false,
            error: 'An unknown error occurred'
        }, 500);
    }
};
exports.getListing = getListing;
const createListing = async (c) => {
    try {
        const body = await c.req.json();
        // Validate the request body against the schema
        const validatedData = validator_1.listingSchema.parse(body);
        // Convert availableDate string to Date object
        const listingData = {
            ...validatedData,
            availableDate: new Date(validatedData.availableDate)
        };
        const newListing = await (0, listings_service_1.createListingService)(listingData);
        return c.json({
            success: true,
            data: newListing
        }, 201);
    }
    catch (error) {
        if (error instanceof Error) {
            return c.json({
                success: false,
                error: error.message
            }, 400);
        }
        return c.json({
            success: false,
            error: 'An unknown error occurred'
        }, 500);
    }
};
exports.createListing = createListing;
const updateListing = async (c) => {
    try {
        const id = parseInt(c.req.param('id'));
        if (isNaN(id)) {
            return c.json({
                success: false,
                error: 'Invalid ID provided'
            }, 400);
        }
        const updateData = await c.req.json();
        if (updateData.availableDate) {
            updateData.availableDate = new Date(updateData.availableDate);
        }
        const updatedListing = await (0, listings_service_1.updateListingService)(id, updateData);
        if (!updatedListing) {
            return c.json({
                success: false,
                message: 'Listing not found'
            }, 404);
        }
        return c.json({
            success: true,
            data: updatedListing
        }, 200);
    }
    catch (error) {
        if (error instanceof Error) {
            return c.json({
                success: false,
                error: error.message
            }, 400);
        }
        return c.json({
            success: false,
            error: 'An unknown error occurred'
        }, 500);
    }
};
exports.updateListing = updateListing;
const deleteListing = async (c) => {
    try {
        const id = parseInt(c.req.param('id'));
        if (isNaN(id)) {
            return c.json({
                success: false,
                error: 'Invalid ID provided'
            }, 400);
        }
        const deletedListing = await (0, listings_service_1.deleteListingService)(id);
        if (!deletedListing) {
            return c.json({
                success: false,
                message: 'Listing not found'
            }, 404);
        }
        return c.json({
            success: true,
            message: 'Listing deleted successfully'
        }, 200);
    }
    catch (error) {
        if (error instanceof Error) {
            return c.json({
                success: false,
                error: error.message
            }, 400);
        }
        return c.json({
            success: false,
            error: 'An unknown error occurred'
        }, 500);
    }
};
exports.deleteListing = deleteListing;
const updateListingStatus = async (c) => {
    try {
        const id = parseInt(c.req.param('id'));
        if (isNaN(id)) {
            return c.json({
                success: false,
                error: 'Invalid ID provided'
            }, 400);
        }
        const { status } = await c.req.json();
        if (!status || !['active', 'sold', 'expired'].includes(status)) {
            return c.json({
                success: false,
                error: 'Invalid status provided'
            }, 400);
        }
        const updatedListing = await (0, listings_service_1.updateListingStatusService)(id, status);
        if (!updatedListing) {
            return c.json({
                success: false,
                message: 'Listing not found'
            }, 404);
        }
        return c.json({
            success: true,
            data: updatedListing
        }, 200);
    }
    catch (error) {
        if (error instanceof Error) {
            return c.json({
                success: false,
                error: error.message
            }, 400);
        }
        return c.json({
            success: false,
            error: 'An unknown error occurred'
        }, 500);
    }
};
exports.updateListingStatus = updateListingStatus;
const getFarmerListings = async (c) => {
    try {
        const farmerId = parseInt(c.req.param('farmerId'));
        // Validate farmerId
        if (isNaN(farmerId)) {
            return c.json({
                success: false,
                error: 'Invalid farmer ID provided'
            }, 400);
        }
        const listings = await (0, listings_service_1.getFarmerListingsService)(farmerId);
        if (!listings || listings.length === 0) {
            return c.json({
                success: false,
                message: 'No listings found for this farmer'
            }, 404);
        }
        return c.json({
            success: true,
            data: listings
        }, 200);
    }
    catch (error) {
        if (error instanceof Error) {
            return c.json({
                success: false,
                error: error.message
            }, 400);
        }
        return c.json({
            success: false,
            error: 'An unknown error occurred'
        }, 500);
    }
};
exports.getFarmerListings = getFarmerListings;
//get productWithListing
const createProductWithListing = async (c) => {
    try {
        // Get request body
        const body = await c.req.json();
        // Validate the request body against the schema
        const validatedData = validator_2.productWithListingSchema.parse(body);
        // Call the service
        const result = await (0, listings_service_1.createProductWithListingService)(validatedData);
        // Handle service response
        if (!result.success) {
            return c.json({
                success: false,
                error: result.error
            }, 400);
        }
        // Return successful response
        return c.json({
            success: true,
            data: result.data
        }, 201);
    }
    catch (error) {
        // Handle validation errors
        if (error instanceof Error) {
            return c.json({
                success: false,
                error: error.message
            }, 400);
        }
        // Handle unknown errors
        return c.json({
            success: false,
            error: 'An unknown error occurred'
        }, 500);
    }
};
exports.createProductWithListing = createProductWithListing;
