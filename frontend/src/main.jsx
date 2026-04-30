import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Users, LayoutDashboard, Receipt, Router, LogOut, Plus, Search
} from "lucide-react";
import "./style.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [page, setPage] = useState("dashboard");
  const [customers, setCustomers] = useState([]);
  const [bills, setBills] = useState([]);
  const [routers, setRouters] = useState([]);
  const [form, setForm] = useState({
    customer_id: "BFN-" + Date.now(),
    full_name: "",
    mobile: "",
    address: "",
    monthly_bill: 500,
    status: "active",
    pppoe_username: "",
    pppoe_password: "",
    notes: ""
  });

  async function loadData() {
    try {
      const [c, b, r] = await Promise.all([
        fetch(`${API}/api/customers`).then(res => res.json()),
        fetch(`${API}/api/bills`).then(res => res.json()),
        fetch(`${API}/api/routers`).then(res => res.json())
      ]);
      setCustomers(Array.isArray(c) ? c : []);
      setBills(Array.isArray(b) ? b : []);
      setRouters(Array.isArray(r) ? r : []);
    } catch {
      alert("Backend connect হয়নি। VITE_API_URL check করো।");
    }
  }

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  async function login(e) {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;

    const res = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) return alert(data.error || "Login failed");

    localStorage.setItem("token", data.token);
    setToken(data.token);
  }

  async function addCustomer(e) {
    e.preventDefault();

    const res = await fetch(`${API}/api/customers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (!res.ok) return alert("Customer add failed");

    alert("Customer added ✅");
    setForm({
      customer_id: "BFN-" + Date.now(),
      full_name: "",
      mobile: "",
      address: "",
      monthly_bill: 500,
      status: "active",
      pppoe_username: "",
      pppoe_password: "",
      notes: ""
    });
    setPage("customers");
    loadData();
  }

  if (!token) {
    return (
      <div className="loginPage">
        <form className="loginCard" onSubmit={login}>
          <div className="logo">BFN</div>
          <h1>BFN ISP Billing</h1>
          <p>স্মার্ট আইএসপি বিলিং ম্যানেজমেন্ট</p>

          <input name="username" placeholder="Username" defaultValue="admin" />
          <input name="password" placeholder="Password" type="password" defaultValue="1234" />
          <button>Login</button>
        </form>
      </div>
    );
  }

  const paid = bills.reduce((s, x) => s + Number(x.paid_amount || 0), 0);
  const due = bills.reduce((s, x) => s + Number(x.due_amount || 0), 0);

  return (
    <div className="app">
      <aside>
        <h2>📡 BFN ISP</h2>

        <button onClick={() => setPage("dashboard")}><LayoutDashboard /> Dashboard</button>
        <button onClick={() => setPage("customers")}><Users /> Customers</button>
        <button onClick={() => setPage("add")}><Plus /> Add Customer</button>
        <button onClick={() => setPage("bills")}><Receipt /> Bills</button>
        <button onClick={() => setPage("routers")}><Router /> Routers</button>

        <button className="logout" onClick={() => {
          localStorage.removeItem("token");
          setToken(null);
        }}>
          <LogOut /> Logout
        </button>
      </aside>

      <main>
        <header>
          <h1>{page.toUpperCase()}</h1>
          <div className="search"><Search size={18} /> Search...</div>
        </header>

        {page === "dashboard" && (
          <>
            <div className="cards">
              <Card title="Total Customers" value={customers.length} />
              <Card title="Active Customers" value={customers.filter(c => c.status === "active").length} />
              <Card title="Disabled" value={customers.filter(c => c.status === "disabled").length} />
              <Card title="Paid Amount" value={`৳${paid}`} />
              <Card title="Due Amount" value={`৳${due}`} danger />
              <Card title="Routers" value={routers.length} />
            </div>

            <section className="panel">
              <h3>Quick Overview</h3>
              <p>Frontend → Render Backend → Supabase → MikroTik</p>
            </section>
          </>
        )}

        {page === "customers" && (
          <section className="panel">
            <h3>Customer List</h3>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Bill</th>
                  <th>PPPoE</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id}>
                    <td>{c.customer_id}</td>
                    <td>{c.full_name}</td>
                    <td>{c.mobile}</td>
                    <td>৳{c.monthly_bill}</td>
                    <td>{c.pppoe_username}</td>
                    <td><span className={c.status === "active" ? "active" : "disabled"}>{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {page === "add" && (
          <section className="panel">
            <h3>Add Customer</h3>
            <form className="gridForm" onSubmit={addCustomer}>
              <input placeholder="Customer ID" value={form.customer_id} onChange={e => setForm({...form, customer_id:e.target.value})} />
              <input placeholder="Full Name" value={form.full_name} onChange={e => setForm({...form, full_name:e.target.value})} />
              <input placeholder="Mobile" value={form.mobile} onChange={e => setForm({...form, mobile:e.target.value})} />
              <input placeholder="Address" value={form.address} onChange={e => setForm({...form, address:e.target.value})} />
              <input placeholder="Monthly Bill" type="number" value={form.monthly_bill} onChange={e => setForm({...form, monthly_bill:e.target.value})} />
              <input placeholder="PPPoE Username" value={form.pppoe_username} onChange={e => setForm({...form, pppoe_username:e.target.value})} />
              <input placeholder="PPPoE Password" value={form.pppoe_password} onChange={e => setForm({...form, pppoe_password:e.target.value})} />
              <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes:e.target.value})}></textarea>
              <button>Add Customer</button>
            </form>
          </section>
        )}

        {page === "bills" && (
          <section className="panel">
            <h3>Bills</h3>
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Month</th>
                  <th>Amount</th>
                  <th>Paid</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bills.map(b => (
                  <tr key={b.id}>
                    <td>{b.invoice_no || b.id}</td>
                    <td>{b.bill_month || b.month}</td>
                    <td>৳{b.amount}</td>
                    <td>৳{b.paid_amount}</td>
                    <td>৳{b.due_amount}</td>
                    <td>{b.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {page === "routers" && (
          <section className="panel">
            <h3>MikroTik Routers</h3>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>IP</th>
                  <th>Port</th>
                  <th>Location</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {routers.map(r => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>{r.ip_address}</td>
                    <td>{r.port}</td>
                    <td>{r.location}</td>
                    <td>{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </div>
  );
}

function Card({ title, value, danger }) {
  return (
    <div className={`card ${danger ? "danger" : ""}`}>
      <p>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
