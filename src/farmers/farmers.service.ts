import { eq } from "drizzle-orm";
import { db } from "../drizzle/db";
import { farmers, users, TSFarmers, TIFarmers } from "../drizzle/schema";
import { get } from "http";

interface FarmerResponse {
  name: string;
  email: string;
  phoneNumber: string;
  farmSize: number | null; // Changed to number since farmSize is decimal in schema
  primaryCrops: string | null; // Made optional since it's nullable in schema
  location: string;
}

interface FarmerWithUserResponse {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
    farmSize: string | null;
    primaryCrops: string | null;
    location: string;
}

interface LocationWithFarmerInfo {
  location: string;
  farmerId: number;
  farmSize: string | null;
  primaryCrops: string | null;
}

export const FarmersService = {
  async getAllFarmers(): Promise<FarmerResponse[]> {
    const results = await db
      .select({
        name: users.name,
        email: users.email,
        phoneNumber: users.phoneNumber,
        farmSize: farmers.farmSize,
        primaryCrops: farmers.primaryCrops,
        location: farmers.location,
      })
      .from(farmers)
      .leftJoin(users, eq(farmers.userId, users.id));

    // Transform results and handle null values
    const transformedResults: FarmerResponse[] = results.map((result) => ({
      name: result.name ?? "", // Convert null to empty string
      email: result.email ?? "", // Convert null to empty string
      phoneNumber: result.phoneNumber ?? "", // Convert null to empty string
      farmSize: result.farmSize ? Number(result.farmSize) : null,
      primaryCrops: result.primaryCrops,
      location: result.location ?? "", // Convert null to empty string
    }));

    return transformedResults;
  },

  //Get By ID
  async getFarmerWithUser(userId: number): Promise<FarmerResponse | null> {
    const [result] = await db
      .select({
        name: users.name,
        email: users.email,
        phoneNumber: users.phoneNumber,
        farmSize: farmers.farmSize,
        primaryCrops: farmers.primaryCrops,
        location: farmers.location,
      })
      .from(farmers)
      .innerJoin(users, eq(farmers.userId, users.id))
      .where(eq(farmers.userId, userId));

    if (!result) return null;

    // Transform the result to match FarmerResponse interface
    const transformedResult: FarmerResponse = {
      name: result.name,
      email: result.email,
      phoneNumber: result.phoneNumber,
      farmSize: result.farmSize ? Number(result.farmSize) : null,
      primaryCrops: result.primaryCrops,
      location: result.location,
    };

    return transformedResult;
  },

  

  async updateFarmer(id: number, input: Partial<TIFarmers>): Promise<TSFarmers> {
    const [updatedFarmer] = await db.update(farmers)
        .set(input)
        .where(eq(farmers.id, id))
        .returning();

        if(!updatedFarmer){
            throw new Error("Farmer not found");
        }
        return updatedFarmer;
  },

  async deleteFarmer(id: number): Promise<void> {
    await db.delete(farmers)
        .where(eq(farmers.id, id));
  },

  async getFarmerByIdService(id: number): Promise<FarmerWithUserResponse | null> {
    const result = await db
        .select({
            id: farmers.id,
            name: users.name,
            email: users.email,
            phoneNumber: users.phoneNumber,
            farmSize: farmers.farmSize,
            primaryCrops: farmers.primaryCrops,
            location: farmers.location,
        })
        .from(farmers)
        .innerJoin(users, eq(farmers.userId, users.id))
        .where(eq(farmers.id, id))
        .limit(1);

    if (!result.length) return null;

    return {
        id: result[0].id,
        name: result[0].name,
        email: result[0].email,
        phoneNumber: result[0].phoneNumber,
        farmSize: result[0].farmSize ,
        primaryCrops: result[0].primaryCrops,
        location: result[0].location ?? "",
    };
  },
  // Get all locations with farmer info
  async getAllLocations(): Promise<LocationWithFarmerInfo[]> {
    const results = await db
      .select({
        location: farmers.location,
        farmerId: farmers.id,
        farmSize: farmers.farmSize,
        primaryCrops: farmers.primaryCrops,
      })
      .from(farmers);
    
    return results.map(result => ({
      location: result.location,
      farmerId: result.farmerId,
      farmSize: result.farmSize,
      primaryCrops: result.primaryCrops
    }));
  },
  async getLocationByFarmerId(farmerId: number): Promise<LocationWithFarmerInfo | null> {
    const [result] = await db
      .select({
        location: farmers.location,
        farmerId: farmers.id,
        farmSize: farmers.farmSize,
        primaryCrops: farmers.primaryCrops,
      })
      .from(farmers)
      .where(eq(farmers.id, farmerId));
    
    if (!result) return null;

    return {
      location: result.location,
      farmerId: result.farmerId,
      farmSize: result.farmSize,
      primaryCrops: result.primaryCrops
    };
  },
};
