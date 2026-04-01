import { db } from "../drizzle/db";
import { orders, listings, TSOrders, TIOrders } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import {
  OrderStatus,
  PaymentStatus,
  CreateOrderInput,
  Order,
} from "../validators/validator";

export const orderService = {
  //get all orders with optional llimit
  getAll: async (limit?: number): Promise<TSOrders[]> => {
    try {
      if (limit) {
        return await db.query.orders.findMany({
          limit: limit,
          with: {
            buyer: true,
            listing: {
              with: {
                farmer: true,
                product: true,
              },
            },
          },
        });
      }
      return await db.query.orders.findMany({
        with: {
          buyer: true,
          listing: {
            with: {
              farmer: true,
              product: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Error fetching all orders:", error);
      throw new Error("Failed to fetch orders");
    }
  },

  create: async (data: CreateOrderInput): Promise<Order> => {
    try {
      // Check listing availability
      const listing = await db.query.listings.findFirst({
        where: eq(listings.id, data.listingId),
      });

      if (!listing) {
        throw new Error("Listing not found");
      }

      // Convert strings to decimals for comparison
      const listingQuantity = parseFloat(listing.quantity);
      const orderQuantity = parseFloat(data.quantity);

      if (listingQuantity < orderQuantity) {
        throw new Error("Insufficient quantity available");
      }

      if (listing.status !== "active") {
        throw new Error("Listing is not active");
      }

      //Ensure buyerId is not null
      if (data.buyerId === null || data.buyerId === undefined) {
        throw new Error("Buyer ID is required");
      }

      // Create order with explicit type assertion
      const [orderResult] = await db
        .insert(orders)
        .values({
          buyerId: data.buyerId,
          listingId: data.listingId,
          quantity: data.quantity,
          totalPrice: data.totalPrice,
          orderStatus: "pending",
          paymentStatus: "pending",
        })
        .returning();

      // Update listing quantity
      const newQuantity = (listingQuantity - orderQuantity).toFixed(2);
      await db
        .update(listings)
        .set({
          quantity: newQuantity,
          status: newQuantity === "0.00" ? "sold" : "active",
          updatedAt: new Date(),
        })
        .where(eq(listings.id, data.listingId));

      // Assert the returned order matches the Order type
      const order: Order = {
        id: orderResult.id,
        createdAt: orderResult.createdAt ?? new Date(),
        updatedAt: orderResult.updatedAt ?? new Date(),
        quantity: orderResult.quantity,
        buyerId: orderResult.buyerId!,
        listingId: orderResult.listingId!,
        totalPrice: orderResult.totalPrice,
        orderStatus: orderResult.orderStatus as OrderStatus,
        paymentStatus: orderResult.paymentStatus as PaymentStatus,
      };

      return order;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  },

  getOrderById: async (id: number): Promise<TSOrders | undefined> => {
    try {
      return await db.query.orders.findFirst({
        where: eq(orders.id, id),
        with: {
          buyer: true,
          listing: {
            with: {
              farmer: true,
              product: true,
            },
          },
        },
      });
    } catch (error) {
      console.error(`Error fetching order ${id}:`, error);
      throw new Error("Failed to fetch order");
    }
  },
  getByUserId: async (userId: number): Promise<TSOrders[]> => {
    try {
      // First get buyer ID from user ID
      const buyer = await db.query.buyers.findFirst({
        where: (buyers, { eq }) => eq(buyers.userId, userId),
      });

      if (!buyer) {
        throw new Error("Buyer not found for this user");
      }

      return await db.query.orders.findMany({
        where: (orders, { eq }) => eq(orders.buyerId, buyer.id),
        with: {
          listing: {
            with: {
              product: true,
              farmer: true,
            },
          },
          logistics: true,
        },
        orderBy: (orders) => [orders.createdAt],
      });
    } catch (error) {
      console.error(`Error fetching orders for user ${userId}:`, error);
      throw new Error("Failed to fetch user orders");
    }
  },
  //update orders
  updateOrder: async (
    id: number,
    updateData: Partial<TIOrders>
  ): Promise<TSOrders> => {
    try {
      const [order] = await db
        .update(orders)
        .set(updateData)
        .where(eq(orders.id, id))
        .returning();

      if (!order) {
        throw new Error("Order not found");
      }

      return order;
    } catch (error) {
      console.error(`Error updating order ${id}:`, error);
      throw new Error("Failed to update order");
    }
  },

  cancelOrder: async (id: number): Promise<TSOrders> => {
    try {
      // 1. Get the order first
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, id),
      });
  
      if (!order || !order.orderStatus) {
        throw new Error("Order not found or invalid status");
      }
  
      // 2. Check if order can be cancelled
      if (order.orderStatus === "cancelled") {
        throw new Error("Order is already cancelled");
      }
  
      if (!["pending", "confirmed"].includes(order.orderStatus)) {
        throw new Error("Order cannot be cancelled in current state");
      }
  
      // 3. Get associated listing
      const listing = await db.query.listings.findFirst({
        where: eq(listings.id, order.listingId),
      });
  
      if (!listing) {
        throw new Error("Associated listing not found");
      }
  
      // 4. First update the quantity
      const newQuantity = sql`${listing.quantity}::numeric + ${order.quantity}::numeric`;
      const updatedQuantity = await db.update(listings)
        .set({
          quantity: newQuantity,
          updatedAt: new Date()
        })
        .where(eq(listings.id, order.listingId))
        .returning();
  
      if (!updatedQuantity || updatedQuantity.length === 0) {
        throw new Error("Failed to update listing quantity");
      }
  
      // 5. Then update the status based on the new quantity
      // Convert string quantity to number for comparison
      const quantityValue = Number(updatedQuantity[0].quantity);
      const updatedListing = await db.update(listings)
        .set({
          status: quantityValue > 0 ? "active" : "sold",
          updatedAt: new Date()
        })
        .where(eq(listings.id, order.listingId))
        .returning();
  
      if (!updatedListing || updatedListing.length === 0) {
        throw new Error("Failed to update listing status");
      }
  
      // 6. Update order status
      const updatedOrders = await db.update(orders)
        .set({
          orderStatus: "cancelled",
          updatedAt: new Date()
        })
        .where(eq(orders.id, id))
        .returning();
  
      if (!updatedOrders || updatedOrders.length === 0) {
        // Rollback listing updates
        await db.update(listings)
          .set({
            quantity: listing.quantity,
            status: listing.status,
            updatedAt: listing.updatedAt
          })
          .where(eq(listings.id, order.listingId));
  
        throw new Error("Failed to update order");
      }
  
      return updatedOrders[0];
  
    } catch (error) {
      console.error(`Error cancelling order ${id}:`, error);
      throw error;
    }
  },

  //get orders for farmer
  getFarmerOrders: async (userId: number): Promise<TSOrders[]> => {
    try {
      // First get farmer ID from user ID
      const farmer = await db.query.farmers.findFirst({
        where: (farmers, { eq }) => eq(farmers.userId, userId),
      });
  
      if (!farmer) {
        throw new Error("Farmer not found");
      }
  
      // First get all listings for this farmer
      const farmerListings = await db.query.listings.findMany({
        where: (listings, { eq }) => eq(listings.farmerId, farmer.id),
        columns: {
          id: true
        }
      });
  
      const listingIds = farmerListings.map(listing => listing.id);
  
      // Then get orders for these listings
      return await db.query.orders.findMany({
        where: (orders, { inArray }) => 
          inArray(orders.listingId, listingIds),
        with: {
          buyer: true,
          listing: {
            with: {
              product: true,
              farmer: true,
            },
          },
        },
        orderBy: (orders) => [orders.createdAt],
      });
    } catch (error) {
      console.error(`Error fetching orders for farmer ${userId}:`, error);
      throw new Error("Failed to fetch farmer orders");
    }
  }
};
