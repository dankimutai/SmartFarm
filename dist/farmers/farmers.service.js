"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FarmersService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../drizzle/db");
const schema_1 = require("../drizzle/schema");
exports.FarmersService = {
    async getAllFarmers() {
        const results = await db_1.db
            .select({
            name: schema_1.users.name,
            email: schema_1.users.email,
            phoneNumber: schema_1.users.phoneNumber,
            farmSize: schema_1.farmers.farmSize,
            primaryCrops: schema_1.farmers.primaryCrops,
            location: schema_1.farmers.location,
        })
            .from(schema_1.farmers)
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.farmers.userId, schema_1.users.id));
        // Transform results and handle null values
        const transformedResults = results.map((result) => ({
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
    async getFarmerWithUser(userId) {
        const [result] = await db_1.db
            .select({
            name: schema_1.users.name,
            email: schema_1.users.email,
            phoneNumber: schema_1.users.phoneNumber,
            farmSize: schema_1.farmers.farmSize,
            primaryCrops: schema_1.farmers.primaryCrops,
            location: schema_1.farmers.location,
        })
            .from(schema_1.farmers)
            .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.farmers.userId, schema_1.users.id))
            .where((0, drizzle_orm_1.eq)(schema_1.farmers.userId, userId));
        if (!result)
            return null;
        // Transform the result to match FarmerResponse interface
        const transformedResult = {
            name: result.name,
            email: result.email,
            phoneNumber: result.phoneNumber,
            farmSize: result.farmSize ? Number(result.farmSize) : null,
            primaryCrops: result.primaryCrops,
            location: result.location,
        };
        return transformedResult;
    },
    async updateFarmer(id, input) {
        const [updatedFarmer] = await db_1.db.update(schema_1.farmers)
            .set(input)
            .where((0, drizzle_orm_1.eq)(schema_1.farmers.id, id))
            .returning();
        if (!updatedFarmer) {
            throw new Error("Farmer not found");
        }
        return updatedFarmer;
    },
    async deleteFarmer(id) {
        await db_1.db.delete(schema_1.farmers)
            .where((0, drizzle_orm_1.eq)(schema_1.farmers.id, id));
    },
    async getFarmerByIdService(id) {
        const result = await db_1.db
            .select({
            id: schema_1.farmers.id,
            name: schema_1.users.name,
            email: schema_1.users.email,
            phoneNumber: schema_1.users.phoneNumber,
            farmSize: schema_1.farmers.farmSize,
            primaryCrops: schema_1.farmers.primaryCrops,
            location: schema_1.farmers.location,
        })
            .from(schema_1.farmers)
            .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.farmers.userId, schema_1.users.id))
            .where((0, drizzle_orm_1.eq)(schema_1.farmers.id, id))
            .limit(1);
        if (!result.length)
            return null;
        return {
            id: result[0].id,
            name: result[0].name,
            email: result[0].email,
            phoneNumber: result[0].phoneNumber,
            farmSize: result[0].farmSize,
            primaryCrops: result[0].primaryCrops,
            location: result[0].location ?? "",
        };
    },
    // Get all locations with farmer info
    async getAllLocations() {
        const results = await db_1.db
            .select({
            location: schema_1.farmers.location,
            farmerId: schema_1.farmers.id,
            farmSize: schema_1.farmers.farmSize,
            primaryCrops: schema_1.farmers.primaryCrops,
        })
            .from(schema_1.farmers);
        return results.map(result => ({
            location: result.location,
            farmerId: result.farmerId,
            farmSize: result.farmSize,
            primaryCrops: result.primaryCrops
        }));
    },
    async getLocationByFarmerId(farmerId) {
        const [result] = await db_1.db
            .select({
            location: schema_1.farmers.location,
            farmerId: schema_1.farmers.id,
            farmSize: schema_1.farmers.farmSize,
            primaryCrops: schema_1.farmers.primaryCrops,
        })
            .from(schema_1.farmers)
            .where((0, drizzle_orm_1.eq)(schema_1.farmers.id, farmerId));
        if (!result)
            return null;
        return {
            location: result.location,
            farmerId: result.farmerId,
            farmSize: result.farmSize,
            primaryCrops: result.primaryCrops
        };
    },
};
