import { db } from "../drizzle/db";
import { logistics, orders, TSLogistics, TILogistics } from "../drizzle/schema";
import { eq , and, or} from "drizzle-orm";
import { CreateLogisticsInput, LogisticsStatus } from "../validators/validator";

export const logisticsService = {
    //Get all logistics
    getAll: async (limit?: number): Promise<TSLogistics[]> => {
        try {
          // Basic query without relations first
          const query = db.select().from(logistics);
          
          // Apply limit if provided
          if (limit) {
            query.limit(limit);
          }
    
          // Execute query
          const results = await query.execute();
          return results;
        } catch (error) {
          console.error("Error fetching all logistics:", error);
          throw new Error("Failed to fetch logistics entries");
        }
      },

        // Create new logistics entry
  create: async (data: CreateLogisticsInput): Promise<TSLogistics> => {
    try {
      // Check if order exists
      const order = await db
        .select()
        .from(orders)
        .where(eq(orders.id, data.orderId))
        .execute();

      if (!order || order.length === 0) {
        throw new Error("Order not found");
      }

      // Check if logistics already exists for this order
      const existingLogistics = await db
        .select()
        .from(logistics)
        .where(eq(logistics.orderId, data.orderId))
        .execute();

      if (existingLogistics && existingLogistics.length > 0) {
        throw new Error("Logistics already exists for this order");
      }

      // Create logistics entry
      const [logisticsResult] = await db
        .insert(logistics)
        .values({
          orderId: data.orderId,
          pickupLocation: data.pickupLocation,
          deliveryLocation: data.deliveryLocation,
          status: "scheduled",
          estimatedDeliveryDate: data.estimatedDeliveryDate,
        })
        .returning();

      // Update order status
      await db
        .update(orders)
        .set({ orderStatus: "confirmed" })
        .where(eq(orders.id, data.orderId));

      return logisticsResult;
    } catch (error) {
      console.error("Error creating logistics:", error);
      throw error;
    }
  },

   // Get logistics by order ID
   getByOrderId: async (orderId: number): Promise<TSLogistics | undefined> => {
    try {
      const result = await db
        .select()
        .from(logistics)
        .where(eq(logistics.orderId, orderId))
        .execute();

      return result[0];
    } catch (error) {
      console.error(`Error fetching logistics for order ${orderId}:`, error);
      throw new Error("Failed to fetch logistics");
    }
  },
   // Update logistics
   updateLogistics: async (
    id: number,
    updateData: Partial<TILogistics>
  ): Promise<TSLogistics> => {
    try {
      const result = await db
        .update(logistics)
        .set(updateData)
        .where(eq(logistics.id, id))
        .returning();

      if (!result || result.length === 0) {
        throw new Error("Logistics entry not found");
      }

      return result[0];
    } catch (error) {
      console.error(`Error updating logistics ${id}:`, error);
      throw new Error("Failed to update logistics");
    }
  },
  // Mark delivery as completed
  markDelivered: async (id: number): Promise<TSLogistics> => {
    try {
      // Get logistics entry
      const result = await db
        .select()
        .from(logistics)
        .where(eq(logistics.id, id))
        .execute();

      if (!result || result.length === 0) {
        throw new Error("Logistics entry not found");
      }

      const logisticsEntry = result[0];

      if (logisticsEntry.status === "completed") {
        throw new Error("Delivery is already marked as completed");
      }

      const deliveryTime = new Date();

      // Update logistics entry
      const [updated] = await db
        .update(logistics)
        .set({
          status: "completed",
          deliveredAt: deliveryTime,
          actualDeliveryDate: deliveryTime,
        })
        .where(eq(logistics.id, id))
        .returning();

      // Update order status
      await db
        .update(orders)
        .set({ orderStatus: "delivered" })
        .where(eq(orders.id, logisticsEntry.orderId));

      return updated;
    } catch (error) {
      console.error(`Error marking delivery ${id} as completed:`, error);
      throw error;
    }
  },
    
 // Get pending deliveries
 getPendingDeliveries: async (
    page = 1,
    limit = 10,
    status?: "scheduled" | "in_progress"
  ) => {
    try {
      const offset = (page - 1) * limit;

      // Create base query for pending deliveries
      const query = db.select().from(logistics);

      // Add status filter
      if (status) {
        query.where(eq(logistics.status, status));
      } else {
        // If no specific status provided, get both scheduled and in_progress
        query.where(
          or(
            eq(logistics.status, "scheduled"),
            eq(logistics.status, "in_progress")
          )
        );
      }

      // Get total count
      const totalResults = await query.execute();

      // Get paginated data
      const data = await query
        .limit(limit)
        .offset(offset)
        .execute();

      return {
        data,
        total: totalResults.length,
        page,
        totalPages: Math.ceil(totalResults.length / limit),
      };
    } catch (error: any) {
      console.error("Error in getPendingDeliveries service:", error);
      throw new Error(`Failed to fetch pending deliveries: ${error.message}`);
    }
  },

  // Get by ID query
  getById: async (id: number): Promise<TSLogistics | null> => {
    try {
      // Ensure id is a valid number
      if (!id || isNaN(id)) {
        throw new Error("Invalid logistics ID");
      }

      const results = await db
        .select()
        .from(logistics)
        .where(eq(logistics.id, id))
        .execute();

      return results[0] || null;
    } catch (error) {
      console.error(`Error fetching logistics ${id}:`, error);
      throw new Error("Failed to fetch logistics");
    }
  },
}