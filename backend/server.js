const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.get("/", (req, res) => {
  res.send("BFN ISP Billing Backend Running");
});

app.get("/customers", async (req, res) => {
  const { data, error } = await supabase.from("customers").select("*");
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.post("/customers", async (req, res) => {
  const { data, error } = await supabase
    .from("customers")
    .insert([req.body])
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});

app.get("/packages", async (req, res) => {
  const { data, error } = await supabase.from("packages").select("*");
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.post("/packages", async (req, res) => {
  const { data, error } = await supabase
    .from("packages")
    .insert([req.body])
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});

app.get("/due-list", async (req, res) => {
  const { data, error } = await supabase
    .from("bills")
    .select("*")
    .neq("status", "paid");

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
