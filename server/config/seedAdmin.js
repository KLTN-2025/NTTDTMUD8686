import bcrypt from "bcrypt";
import Admin from "../models/Admin.js";

export default async function ensureDefaultAdmin() {
  const USERNAME = "admin";
  const PASSWORD = "12341234";

  const existing = await Admin.findOne({ username: USERNAME.toLowerCase() });

  if (existing) return;

  const hashed = await bcrypt.hash(PASSWORD, 10);
  await Admin.create({
    username: USERNAME.toLowerCase(),
    password: hashed,
    email: "admin@system.local",
  });

  console.log("✅ Seeded default admin: admin / 12341234");
}
