import { Context } from "hono";
import { 
  getListingsService, 
  getListingByIdService,
  createListingService, 
  updateListingService,
  deleteListingService, 
  updateListingStatusService,
  getFarmerListingsService,
  createProductWithListingService
} from "./listings.service";
import { TIListings } from "../drizzle/schema";
import { listingSchema } from "../validators/validator";
import { productWithListingSchema } from "../validators/validator";

export const getAllListings = async (c: Context) => {
  try {
    const limit = Number(c.req.query('limit'));
    const listings = await getListingsService(limit);
    
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
  } catch (error) {
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

export const getListing = async (c: Context) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ 
        success: false,
        error: 'Invalid ID provided' 
      }, 400);
    }

    const listing = await getListingByIdService(id);
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
  } catch (error) {
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

export const createListing = async (c: Context) => {
  try {
    const body = await c.req.json();
    
    // Validate the request body against the schema
    const validatedData = listingSchema.parse(body);
    
    // Convert availableDate string to Date object
    const listingData = {
      ...validatedData,
      availableDate: new Date(validatedData.availableDate)
    };
    
    const newListing = await createListingService(listingData);
    
    return c.json({ 
      success: true,
      data: newListing 
    }, 201);
  } catch (error) {
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

export const updateListing = async (c: Context) => {
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

    const updatedListing = await updateListingService(id, updateData);
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
  } catch (error) {
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

export const deleteListing = async (c: Context) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ 
        success: false,
        error: 'Invalid ID provided' 
      }, 400);
    }

    const deletedListing = await deleteListingService(id);
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
  } catch (error) {
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

export const updateListingStatus = async (c: Context) => {
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

    const updatedListing = await updateListingStatusService(id, status);
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
  } catch (error) {
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

export const getFarmerListings = async (c: Context) => {
  try {
    const farmerId = parseInt(c.req.param('farmerId'));
    
    // Validate farmerId
    if (isNaN(farmerId)) {
      return c.json({ 
        success: false,
        error: 'Invalid farmer ID provided' 
      }, 400);
    }

    const listings = await getFarmerListingsService(farmerId);
    
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
    
  } catch (error) {
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


//get productWithListing
export const createProductWithListing = async (c: Context) => {
  try {
    // Get request body
    const body = await c.req.json();
    
    // Validate the request body against the schema
    const validatedData = productWithListingSchema.parse(body);
    
    // Call the service
    const result = await createProductWithListingService(validatedData);
    
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
  } catch (error) {
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