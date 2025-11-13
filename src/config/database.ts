import mongoose from "mongoose";

export async function connectDatabase() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is not defined");
    }
    await mongoose.connect(process.env.MONGO_URI as string);
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    throw err; 
  }
}
