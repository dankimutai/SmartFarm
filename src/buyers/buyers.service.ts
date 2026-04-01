import { eq } from "drizzle-orm";
import { db } from "../drizzle/db";
import {
  buyers,
  users,
  TSBuyers,
  TIBuyers,
  TSFarmers,
} from "../drizzle/schema";
import { roleEnum } from "../drizzle/schema";

interface BuyerWithUser {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  companyName: string | null;
  businessType: string | null;
}

export const buyersService = {
  //Get All buyers with optional limit
  getAll: async (limit?: number): Promise<TSBuyers[]> => {
    const query = await db
      .select({
        id: buyers.id,
        userId: buyers.userId, // Include userId to match expected return type
        name: users.name,
        email: users.email,
        phoneNumber: users.phoneNumber,
        companyName: buyers.companyName,
        businessType: buyers.businessType,
      })
      .from(buyers)
      .innerJoin(users, eq(buyers.userId, users.id))
      .orderBy(users.createdAt)
      .limit(limit ?? Number.MAX_SAFE_INTEGER); // Set limit or return all

    return query; // Return correct structured data
  },
  //Get a single user by ID
  async getById(id: number): Promise<TSBuyers | null> {
    const [buyer] = await db
      .select({
        id: buyers.id,
        userId: buyers.userId,
        companyName: buyers.companyName,
        businessType: buyers.businessType,
        name: users.name,
        email: users.email,
        phoneNumber: users.phoneNumber,
      })
      .from(buyers)
      .innerJoin(users, eq(buyers.userId, users.id))
      .where(eq(buyers.id, id));

    return buyer || null;
  },

  //UPDATE BUYER DETAILS
  async updateBuyer(
    id: number,
    data: Partial<TIBuyers>
  ): Promise<TSBuyers | null> {
    const [updatedBuyer] = await db
      .update(buyers)
      .set(data)
      .where(eq(buyers.id, id))
      .returning();

    if (!updatedBuyer) return null;

    const buyerWithUser = await this.getById(id);
    return buyerWithUser;
  },

  //delete
  async deleteBuyer(id: number): Promise<TSBuyers | null> {
    const [deletedBuyer] = await db
      .delete(buyers)
      .where(eq(buyers.id, id))
      .returning();
    return deletedBuyer;
  },
};
