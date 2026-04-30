import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 🔐 Login
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (!user) return res.status(401).json({ error: "User not found" });

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.status(401).json({ error: "Wrong password" });

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

  res.json({ token, user });
});

// 🔥 Create Admin (one-time use)
app.get("/api/setup-admin", async (req, res) => {
  try {
    const hashed = await bcrypt.hash("1234", 10);

    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          username: "admin",
          password_hash: hashed,
          full_name: "System Admin",
          mobile: "01700000000",
          role_id: 1,
          status: "active"
        }
      ]);

    if (error) {
      return res.json({ message: "Admin already exists or error", error });
    }

    res.json({ message: "Admin created successfully ✅" });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// 👥 Get customers
app.get("/api/customers", async (req, res) => {
  const { data } = await supabase.from("customers").select("*");
  res.json(data);
});

// ➕ Add customer
app.post("/api/customers", async (req, res) => {
  const body = req.body;

  const { data, error } = await supabase
    .from("customers")
    .insert([body]);

  if (error) return res.status(400).json(error);

  res.json(data);
});

// 📡 Routers
app.get("/api/routers", async (req, res) => {
  const { data } = await supabase.from("routers").select("*");
  res.json(data);
});

// 💰 Bills
app.get("/api/bills", async (req, res) => {
  const { data } = await supabase.from("bills").select("*");
  res.json(data);
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
