import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Admin from "../src/models/Admin";
import Visitor from "../src/models/Visitor";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/neu-library";

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@neu.edu.ph";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  const existingAdmin = await Admin.findOne({ email: adminEmail });
  if (existingAdmin) {
    console.log(`Admin ${adminEmail} already exists. Skipping admin seed.`);
  } else {
    const hashed = await bcrypt.hash(adminPassword, 10);
    await Admin.create({
      email: adminEmail,
      password: hashed,
      name: "Library Admin",
    });
    console.log(`Created admin: ${adminEmail} (password: ${adminPassword})`);
  }

  const sampleVisitors = [
    {
      name: "Juan Dela Cruz",
      email: "juan.delacruz@neu.edu.ph",
      rfid: "RFID001",
      program: "BSIT",
      type: "student",
    },
    {
      name: "Maria Santos",
      email: "maria.santos@neu.edu.ph",
      rfid: "RFID002",
      program: "BSCS",
      type: "student",
    },
    {
      name: "Dr. Pedro Reyes",
      email: "pedro.reyes@neu.edu.ph",
      program: "Faculty - CICS",
      type: "faculty",
    },
  ];

  for (const v of sampleVisitors) {
    const exists = await Visitor.findOne({ email: v.email });
    if (!exists) {
      await Visitor.create(v);
      console.log(`Created visitor: ${v.name}`);
    }
  }

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
