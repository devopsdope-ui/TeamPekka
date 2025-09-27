import mongoose from "mongoose";
import dotenv from "dotenv";
import Topic from "../models/Topic.js";
import Problem from "../models/Problem.js";
import User from "../models/User.js";
import { hashPassword } from "./hashPassword.js";

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected...");

    // Clear old data
    await Topic.deleteMany();
    await Problem.deleteMany();
    await User.deleteMany();

    // Create default topics
    const topics = await Topic.insertMany([
      {
        title: "Arrays",
        slug: "arrays",
        difficulty: "Beginner",
        category: "Data Structures",
        isActive: true,
        isPublished: true,
        sections: [],
      },
      {
        title: "Dynamic Programming",
        slug: "dynamic-programming",
        difficulty: "Advanced",
        category: "Algorithms",
        isActive: true,
        isPublished: true,
        sections: [],
      },
    ]);

    // Create some problems
    await Problem.insertMany([
      {
        title: "Two Sum",
        slug: "two-sum",
        difficulty: "Beginner",
        topic: topics[0]._id,
        isActive: true,
      },
      {
        title: "Longest Increasing Subsequence",
        slug: "lis",
        difficulty: "Advanced",
        topic: topics[1]._id,
        isActive: true,
      },
    ]);

    // Create admin user
    const adminPassword = await hashPassword("admin123");
    await User.create({
      name: "Admin",
      email: "admin@example.com",
      password: adminPassword,
      role: "admin",
    });

    console.log("✅ Database seeded successfully!");
    process.exit();
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
};

seed();
