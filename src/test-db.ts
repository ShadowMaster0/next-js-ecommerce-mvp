// src/test-db.ts
import db from "./db/db";  // Adjusted path

async function testConnection() {
  try {
    const users = await db.user.findMany();
    console.log("Users:", users);
  } catch (error) {
    console.error("Database connection failed:", error);
  }
}

testConnection();
