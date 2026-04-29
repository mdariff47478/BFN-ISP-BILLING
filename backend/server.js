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
