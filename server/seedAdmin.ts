import "dotenv/config";
import dotenv from "dotenv";
import path from "node:path";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import connectDB from "./config/db.js";
import { User } from "./models/user.js";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env"), override: true });
dotenv.config({ path: path.resolve(process.cwd(), "server", ".env"), override: true });

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@metscheduler.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin@123456";
const ADMIN_NAME = "MetScheduler Administrator";

async function seedAdmin() {
  console.log("Connecting to MongoDB for admin seeding...");
  const connected = await connectDB();
  if (!connected && mongoose.connection.readyState !== 1) {
    console.error("❌ Could not establish database connection. Please check MongoDB Atlas credentials and IP whitelist.");
    process.exit(1);
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    const existingUser = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });

    if (existingUser) {
      existingUser.password = hashedPassword;
      existingUser.role = "admin";
      existingUser.plan = "business";
      existingUser.billingStatus = "active";
      if (!existingUser.name) existingUser.name = ADMIN_NAME;
      await existingUser.save();
      console.log("✅ Admin user updated successfully!");
    } else {
      await User.create({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL.toLowerCase(),
        password: hashedPassword,
        role: "admin",
        plan: "business",
        billingStatus: "active",
      });
      console.log("✅ Admin user created successfully!");
    }

    console.log("\n=================================");
    console.log("🔑 METSCHEDULER ADMIN CREDENTIALS");
    console.log("=================================");
    console.log(`Email:    ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log(`Role:     admin`);
    console.log(`Plan:     business`);
    console.log("=================================\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Failed to seed admin user:", error?.message || error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

seedAdmin();
