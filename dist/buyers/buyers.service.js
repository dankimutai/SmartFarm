"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buyersService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../drizzle/db");
const schema_1 = require("../drizzle/schema");
exports.buyersService = {
    //Get All buyers with optional limit
    getAll: async (limit) => {
        const query = await db_1.db
            .select({
            id: schema_1.buyers.id,
            userId: schema_1.buyers.userId, // Include userId to match expected return type
            name: schema_1.users.name,
            email: schema_1.users.email,
            phoneNumber: schema_1.users.phoneNumber,
            companyName: schema_1.buyers.companyName,
            businessType: schema_1.buyers.businessType,
        })
            .from(schema_1.buyers)
            .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.buyers.userId, schema_1.users.id))
            .orderBy(schema_1.users.createdAt)
            .limit(limit ?? Number.MAX_SAFE_INTEGER); // Set limit or return all
        return query; // Return correct structured data
    },
    //Get a single user by ID
    async getById(id) {
        const [buyer] = await db_1.db
            .select({
            id: schema_1.buyers.id,
            userId: schema_1.buyers.userId,
            companyName: schema_1.buyers.companyName,
            businessType: schema_1.buyers.businessType,
            name: schema_1.users.name,
            email: schema_1.users.email,
            phoneNumber: schema_1.users.phoneNumber,
        })
            .from(schema_1.buyers)
            .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.buyers.userId, schema_1.users.id))
            .where((0, drizzle_orm_1.eq)(schema_1.buyers.id, id));
        return buyer || null;
    },
    //UPDATE BUYER DETAILS
    async updateBuyer(id, data) {
        const [updatedBuyer] = await db_1.db
            .update(schema_1.buyers)
            .set(data)
            .where((0, drizzle_orm_1.eq)(schema_1.buyers.id, id))
            .returning();
        if (!updatedBuyer)
            return null;
        const buyerWithUser = await this.getById(id);
        return buyerWithUser;
    },
    //delete
    async deleteBuyer(id) {
        const [deletedBuyer] = await db_1.db
            .delete(schema_1.buyers)
            .where((0, drizzle_orm_1.eq)(schema_1.buyers.id, id))
            .returning();
        return deletedBuyer;
    },
};
