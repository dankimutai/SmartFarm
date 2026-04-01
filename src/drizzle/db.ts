import {drizzle, NeonHttpDatabase} from "drizzle-orm/neon-http";
import {neon} from "@neondatabase/serverless";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_zy6BJFp4uLvC@ep-cold-bread-a8vi0g6o-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = neon(databaseUrl);
export const db: NeonHttpDatabase<typeof schema> = drizzle(sql, {schema, logger: true});