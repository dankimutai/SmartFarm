import { db } from "../drizzle/db";
import { listings, TIListings,farmerCrops,users, products } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { listingSchema } from "../validators/validator";
import { 
  ProductWithListingInput, 
  productWithListingSchema, 
  ProductWithListingResponse 
} from "../validators/validator";


export const getListingsService = async (limit?: number) => {
  try {
    return await db.query.listings.findMany({
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
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error fetching listings: ${error.message}`);
    }
    throw new Error('Unknown error occurred while fetching listings');
  }
};

export const getListingByIdService = async (id: number) => {
  try {
    const listing = await db.query.listings.findFirst({
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
  } catch (error) {
    console.log(error);
    if (error instanceof Error) {
      throw new Error(`Error fetching listing: ${error.message}`);
    }
    throw new Error('Unknown error occurred while fetching listing');
  }
};

export const createListingService = async (data: Omit<TIListings, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    // Convert the date string to a Date object
    const listingData = {
      ...data,
      availableDate: new Date(data.availableDate),
    };

    const newListing = await db.insert(listings).values(listingData).returning();
    return newListing[0];
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const updateListingService = async (id: number, listing: Partial<TIListings>) => {
  try {
    const updatedListing = await db
      .update(listings)
      .set({ ...listing, updatedAt: new Date() })
      .where(eq(listings.id, id))
      .returning();
    return updatedListing[0];
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const deleteListingService = async (id: number) => {
  try {
    const deletedListing = await db
      .delete(listings)
      .where(eq(listings.id, id))
      .returning();
    return deletedListing[0];
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const updateListingStatusService = async (id: number, status: 'active' | 'sold' | 'expired') => {
  try {
    const updatedListing = await db
      .update(listings)
      .set({ status, updatedAt: new Date() })
      .where(eq(listings.id, id))
      .returning();
    return updatedListing[0];
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getFarmerListingsService = async (farmerId: number) => {
  try {
    const farmersListings = await db.query.listings.findMany({
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

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error fetching farmer listings: ${error.message}`);
    }
    throw new Error('Unknown error occurred while fetching farmer listings');
  }
};


export const createProductWithListingService = async (
  data: ProductWithListingInput
): Promise<ProductWithListingResponse> => {
  try {
    // 1. Validate input data
    const validatedData = productWithListingSchema.parse(data);

    // 2. Create product
    const [newProduct] = await db
      .insert(products)
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
    const [newListing] = await db
      .insert(listings)
      .values({
        farmerId: validatedData.listing.farmerId,
        productId: newProduct.id,
        quantity: validatedData.listing.quantity.toString(),
        price: validatedData.listing.price.toString(),
        availableDate: new Date(validatedData.listing.availableDate),
        status: 'active' as const // Use const assertion to fix type
      })
      .returning();

    if (!newListing) {
      // Clean up by deleting the product if listing creation fails
      await db
        .delete(products)
        .where(eq(products.id, newProduct.id));

      return {
        success: false,
        error: 'Failed to create listing'
      };
    }

    // 4. Fetch the complete listing with product details
    const completeData = await db.query.listings.findFirst({
      where: eq(listings.id, newListing.id),
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
      status: (completeData.status || 'active') as 'active' | 'sold' | 'expired',
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

  } catch (error) {
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