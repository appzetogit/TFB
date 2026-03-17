import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/database.js";
import Restaurant from "../modules/restaurant/models/Restaurant.js";

dotenv.config();

async function backfillLocations() {
  try {
    await connectDB();

    const cursor = Restaurant.find({
      $or: [
        { "location.coordinates": { $exists: false } },
        { "location.coordinates.0": { $exists: false } },
        { "location.coordinates.1": { $exists: false } },
      ],
    }).cursor();

    let updated = 0;
    for await (const restaurant of cursor) {
      const loc = restaurant.location || {};
      const lat = loc.latitude;
      const lng = loc.longitude;

      if (typeof lat === "number" && typeof lng === "number") {
        restaurant.location = {
          ...loc,
          type: "Point",
          coordinates: [lng, lat],
        };
        await restaurant.save();
        updated += 1;
      }
    }

    console.log(`✅ Backfill complete. Updated ${updated} restaurants.`);
  } catch (err) {
    console.error("❌ Error backfilling restaurant locations:", err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

backfillLocations();

