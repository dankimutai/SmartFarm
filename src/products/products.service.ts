import { eq, and, like, count, gt } from "drizzle-orm";
import { db } from "../drizzle/db";
import { products, listings, TIProducts, TSProducts } from "../drizzle/schema";
import { ProductFilter } from "../validators/validator";

export const productService = {
  // ✅ Get all products
  getAll: async (): Promise<TSProducts[]> => {
    return await db.query.products.findMany();
  },

  // ✅ Get product by ID
  getById: async (id: number): Promise<TSProducts | null> => {
    return await db.query.products.findFirst({ where: eq(products.id, id) }) ?? null;
  },

  // ✅ Create new product
  create: async (data: TIProducts): Promise<TSProducts> => {
    const [newProduct] = await db.insert(products).values(data).returning();
    return newProduct;
  },

  // ✅ Update product
  update: async (id: number, data: Partial<TIProducts>): Promise<TSProducts | null> => {
    const [updatedProduct] = await db
      .update(products)
      .set(data)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct ?? null;
  },

  // ✅ Delete product
  delete: async (id: number): Promise<TSProducts | null> => {
    const [deletedProduct] = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning();
    return deletedProduct ?? null;
  },

  // ✅ Search products with filters
  search: async (filters: ProductFilter) => {
    const { name, category, minListings } = filters;

    // Initialize conditions array
    const conditions = [];

    // Apply search filters dynamically
    if (name) {
      conditions.push(like(products.name, `%${name}%`));
    }

    if (category) {
      conditions.push(like(products.category, `%${category}%`));
    }

    if (minListings) {
      const subquery = db
        .select({ total: count() })
        .from(listings)
        .where(eq(listings.productId, products.id));

      conditions.push(gt(subquery.as("listingsCount"), minListings));
    }

    // Execute query dynamically (NO direct modification of `query` object)
    try {
      const result = await db
        .select({
          id: products.id,
          name: products.name,
          category: products.category,
          unit: products.unit,
          imageUrl: products.imageUrl,
        })
        .from(products)
        .where(and(...conditions)) // ✅ Apply conditions dynamically
        .execute(); // ✅ Ensure query is executed

      console.log("Search Results:", result);
      return result;
    } catch (error) {
      console.error("Error executing search query:", error);
      throw new Error("Database query execution failed");
    }
  },

  // ✅ Get product with active listings
  getWithListings: async (id: number): Promise<any> => {
    return await db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        listings: {
          where: eq(listings.status, "active"),
          columns: {
            id: true,
            quantity: true,
            price: true,
            availableDate: true,
          },
        },
      },
    });
  },

  // ✅ Get paginated products
  getPaginated: async (page: number, pageSize: number = 10): Promise<{
    data: TSProducts[];
    total: number;
    page: number;
    pageSize: number;
  }> => {
    const offset = (page - 1) * pageSize;
    
    const [data, total] = await Promise.all([
      db.query.products.findMany({
        limit: pageSize,
        offset: offset,
      }),
      
      db.query.products.findMany({}).then((res) => ({ count: res.length })),
    ]);

    return {
      data,
      total: total.count,
      page,
      pageSize,
    };
  },

  //getAll With Listings
  getAllWithListings: async () => {
    try {
      return await db.query.products.findMany({
        columns: {
          id: true,
          name: true,
          category: true,
          unit: true,
          imageUrl: true,
        },
        with: {
          listings: {
            where: eq(listings.status, "active"),
            columns: {
              id: true,
              quantity: true,
              price: true,
              availableDate: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Error fetching products with listings:", error);
      throw new Error("Failed to fetch products with listings");
    }
  },
};
