import mongoose from "mongoose";

export async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("✅ MongoDB Atlas connected!");
  } catch (err) {
    console.error("❌ Error connecting to MongoDB:", err);
    process.exit(1);
  }
}
