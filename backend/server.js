const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 🔐 login route
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });
    return res.json({ token });
  } else {
    return res.status(401).json({ error: "Invalid login" });
  }
});

// ❌ Delete customer
app.delete("/customers/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id);

  if (error) return res.status(400).json({ error });
  res.json({ success: true });
});

// ✏️ Update customer
app.put("/customers/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { full_name, phone, address, pppoe_username, package_name, monthly_bill } = req.body;

  const { error } = await supabase
    .from("customers")
    .update({ full_name, phone, address, pppoe_username, package_name, monthly_bill })
    .eq("id", id);

  if (error) return res.status(400).json({ error });
  res.json({ success: true });
});

// 🔐 middleware
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ error: "Invalid token" });
  }
}

// ✅ protected add customer
app.post("/customers", verifyToken, async (req, res) => {
  const { full_name, phone, address, pppoe_username, package_name, monthly_bill } = req.body;

  const { data, error } = await supabase
    .from("customers")
    .insert([{ full_name, phone, address, pppoe_username, package_name, monthly_bill }]);

  if (error) return res.status(400).json({ error });
  res.json({ success: true, data });
});

// ✅ protected get customers
app.get("/customers", verifyToken, async (req, res) => {
  const { data, error } = await supabase.from("customers").select("*");
  if (error) return res.status(400).json({ error });
  res.json(data);
});

app.listen(10000, () => console.log("Server running"));

// GET bills
app.get("/bills", verifyToken, async (req, res) => {
  const { data, error } = await supabase
    .from("bills")
    .select("*, customers(full_name, phone)");

  if (error) return res.status(400).json({ error });
  res.json(data);
});

// CREATE bill
app.post("/bills", verifyToken, async (req, res) => {
  const { customer_id, month, amount } = req.body;

  const { data, error } = await supabase
    .from("bills")
    .insert([{ customer_id, month, amount, status: "unpaid" }])
    .select();

  if (error) return res.status(400).json({ error });
  res.json(data[0]);
});

// MARK PAID
app.put("/bills/:id/paid", verifyToken, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("bills")
    .update({ status: "paid", paid_amount: req.body.paid_amount })
    .eq("id", id);

  if (error) return res.status(400).json({ error });
  res.json({ success: true });
});
