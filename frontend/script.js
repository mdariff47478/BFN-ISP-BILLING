const LS = {
  logged: "isp_logged_in",
  admin: "isp_admin",
  customers: "isp_customers",
  bills: "isp_bills",
  settings: "isp_settings"
};

const demoCustomers = [
  {
    id: 1001,
    name: "Arif Hossain",
    mobile: "01711111111",
    address: "Dhaka",
    package: "20 Mbps",
    bill: 800,
    status: "Active",
    date: "2026-04-01"
  },
  {
    id: 1002,
    name: "Rahim Uddin",
    mobile: "01822222222",
    address: "Gazipur",
    package: "10 Mbps",
    bill: 500,
    status: "Active",
    date: "2026-04-05"
  },
  {
    id: 1003,
    name: "Hasan Mahmud",
    mobile: "01933333333",
    address: "Narayanganj",
    package: "30 Mbps",
    bill: 1000,
    status: "Disabled",
    date: "2026-04-08"
  }
];

const defaultSettings = {
  ispName: "BFN ISP Billing Bangladesh",
  ispMobile: "01989647478",
  ispAddress: "Dhaka, Bangladesh",
  bkash: "01989647478",
  nagad: "01989647478",
  rocket: "01989647478"
};

function getData(key, fallback = []) {
  return JSON.parse(localStorage.getItem(key)) || fallback;
}

function setData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function initDefaultData() {
  if (!localStorage.getItem(LS.admin)) {
    setData(LS.admin, { username: "admin", password: "1234" });
  }

  if (!localStorage.getItem(LS.customers)) {
    setData(LS.customers, demoCustomers);
  }

  if (!localStorage.getItem(LS.bills)) {
    setData(LS.bills, []);
  }

  if (!localStorage.getItem(LS.settings)) {
    setData(LS.settings, defaultSettings);
  }
}

function toast(message) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2500);
}

function currentMonth() {
  const d = new Date();
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function formatMoney(amount) {
  return "৳" + Number(amount || 0).toLocaleString("en-BD");
}

function setCurrentDate() {
  const el = document.getElementById("currentDate");
  if (!el) return;
  el.textContent = new Date().toLocaleDateString("bn-BD", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function toggleSidebar() {
  document.getElementById("sidebar")?.classList.toggle("open");
}

function authGuard() {
  const page = document.body.dataset.page;
  if (page && localStorage.getItem(LS.logged) !== "true") {
    window.location.href = "login.html";
  }

  if (!page && location.pathname.includes("login.html")) {
    if (localStorage.getItem(LS.logged) === "true") {
      window.location.href = "index.html";
    }
  }
}

function setupLogin() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", function(e) {
    e.preventDefault();

    const admin = getData(LS.admin, { username: "admin", password: "1234" });
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    const error = document.getElementById("loginError");

    if (username === admin.username && password === admin.password) {
      localStorage.setItem(LS.logged, "true");
      window.location.href = "index.html";
    } else {
      error.textContent = "ভুল ইউজারনেম অথবা পাসওয়ার্ড!";
    }
  });
}

function logout() {
  localStorage.removeItem(LS.logged);
  window.location.href = "login.html";
}

function renderDashboard() {
  if (document.body.dataset.page !== "dashboard") return;

  const customers = getData(LS.customers);
  const bills = getData(LS.bills);

  const active = customers.filter(c => c.status === "Active").length;
  const paid = bills.reduce((s, b) => s + Number(b.paidAmount || 0), 0);
  const due = bills.reduce((s, b) => s + Math.max(Number(b.amount) - Number(b.paidAmount || 0), 0), 0);

  document.getElementById("totalCustomers").textContent = customers.length;
  document.getElementById("activeUsers").textContent = active;
  document.getElementById("monthlyCollection").textContent = formatMoney(paid);
  document.getElementById("dueAmount").textContent = formatMoney(due);

  const recent = document.getElementById("recentCustomersTable");
  recent.innerHTML = customers.slice(-5).reverse().map(c => `
    <tr>
      <td>#${c.id}</td>
      <td>${c.name}</td>
      <td>${c.mobile}</td>
      <td>${c.package}</td>
      <td><span class="badge ${c.status.toLowerCase()}">${c.status}</span></td>
    </tr>
  `).join("");

  const dueTable = document.getElementById("dueBillsTable");
  const dueBills = bills.filter(b => b.status !== "Paid").slice(-5).reverse();
  dueTable.innerHTML = dueBills.length ? dueBills.map(b => `
    <tr>
      <td>${b.customerName}</td>
      <td>${b.month}</td>
      <td>${formatMoney(b.amount)}</td>
      <td>${formatMoney(b.amount - b.paidAmount)}</td>
      <td><span class="badge ${b.status.toLowerCase()}">${b.status}</span></td>
    </tr>
  `).join("") : `<tr><td colspan="5">কোনো বকেয়া বিল নেই</td></tr>`;

  renderCollectionOverview();
}

function renderCollectionOverview() {
  const box = document.getElementById("collectionOverview");
  if (!box) return;

  const months = ["January", "February", "March", "April", "May", "June"];
  box.innerHTML = months.map((m, i) => {
    const value = [45, 65, 52, 78, 88, 70][i];
    return `
      <div class="bar-row">
        <b>${m}</b>
        <div class="bar"><span style="width:${value}%"></span></div>
        <span>${value}%</span>
      </div>
    `;
  }).join("");
}

function setupCustomersPage() {
  if (document.body.dataset.page !== "customers") return;

  let filter = "All";
  const search = document.getElementById("customerSearch");

  function render() {
    const q = search.value.toLowerCase();
    let customers = getData(LS.customers);

    customers = customers.filter(c => {
      const match = `${c.id} ${c.name} ${c.mobile} ${c.address} ${c.package}`.toLowerCase().includes(q);
      const statusMatch = filter === "All" || c.status === filter;
      return match && statusMatch;
    });

    document.getElementById("customersTable").innerHTML = customers.map(c => `
      <tr>
        <td>#${c.id}</td>
        <td>${c.name}</td>
        <td>${c.mobile}</td>
        <td>${c.address}</td>
        <td>${c.package}</td>
        <td>${formatMoney(c.bill)}</td>
        <td><span class="badge ${c.status.toLowerCase()}">${c.status}</span></td>
        <td>${c.date}</td>
        <td>${customerActions(c)}</td>
      </tr>
    `).join("");

    document.getElementById("customerMobileCards").innerHTML = customers.map(c => `
      <div class="customer-card">
        <h3>${c.name}</h3>
        <p>📱 ${c.mobile}</p>
        <p>📍 ${c.address}</p>
        <p>📦 ${c.package} — ${formatMoney(c.bill)}</p>
        <p><span class="badge ${c.status.toLowerCase()}">${c.status}</span></p>
        <div class="action-row">${customerActions(c)}</div>
      </div>
    `).join("");
  }

  search.addEventListener("input", render);

  document.querySelectorAll("[data-filter]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-filter]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      filter = btn.dataset.filter;
      render();
    });
  });

  render();
}

function customerActions(c) {
  return `
    <div class="action-row">
      <a class="btn-light" href="edit-customer.html?id=${c.id}">Edit</a>
      <button class="btn-warning" onclick="toggleCustomerStatus(${c.id})">${c.status === "Active" ? "Disable" : "Enable"}</button>
      <button class="btn-danger" onclick="deleteCustomer(${c.id})">Delete</button>
    </div>
  `;
}

function toggleCustomerStatus(id) {
  const customers = getData(LS.customers);
  const updated = customers.map(c => c.id == id ? { ...c, status: c.status === "Active" ? "Disabled" : "Active" } : c);
  setData(LS.customers, updated);
  toast("কাস্টমার স্ট্যাটাস আপডেট হয়েছে");
  setupCustomersPage();
  renderDashboard();
}

function deleteCustomer(id) {
  if (!confirm("এই কাস্টমার ডিলিট করবেন?")) return;
  setData(LS.customers, getData(LS.customers).filter(c => c.id != id));
  toast("কাস্টমার ডিলিট হয়েছে");
  setupCustomersPage();
}

function setupAddCustomer() {
  const form = document.getElementById("addCustomerForm");
  if (!form) return;

  form.date.value = new Date().toISOString().slice(0, 10);

  form.addEventListener("submit", e => {
    e.preventDefault();
    const customers = getData(LS.customers);
    const data = Object.fromEntries(new FormData(form));

    const customer = {
      id: Date.now(),
      name: data.name.trim(),
      mobile: data.mobile.trim(),
      address: data.address.trim(),
      package: data.package,
      bill: Number(data.bill),
      date: data.date,
      status: data.status
    };

    if (!customer.name || !customer.mobile || !customer.bill) {
      toast("সব প্রয়োজনীয় তথ্য দিন");
      return;
    }

    customers.push(customer);
    setData(LS.customers, customers);
    toast("কাস্টমার সফলভাবে যোগ হয়েছে");

    setTimeout(() => window.location.href = "customers.html", 700);
  });
}

function setupEditCustomer() {
  const form = document.getElementById("editCustomerForm");
  if (!form) return;

  const id = new URLSearchParams(location.search).get("id");
  const customers = getData(LS.customers);
  const customer = customers.find(c => String(c.id) === String(id));

  if (!customer) {
    toast("কাস্টমার পাওয়া যায়নি");
    setTimeout(() => window.location.href = "customers.html", 900);
    return;
  }

  form.name.value = customer.name;
  form.mobile.value = customer.mobile;
  form.address.value = customer.address;
  form.package.value = customer.package;
  form.bill.value = customer.bill;
  form.date.value = customer.date;
  form.status.value = customer.status;

  form.addEventListener("submit", e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));

    const updated = customers.map(c => String(c.id) === String(id) ? {
      ...c,
      name: data.name.trim(),
      mobile: data.mobile.trim(),
      address: data.address.trim(),
      package: data.package,
      bill: Number(data.bill),
      date: data.date,
      status: data.status
    } : c);

    setData(LS.customers, updated);
    toast("কাস্টমার আপডেট হয়েছে");
    setTimeout(() => window.location.href = "customers.html", 700);
  });
}

function generateCurrentMonthBills() {
  const customers = getData(LS.customers).filter(c => c.status === "Active");
  const bills = getData(LS.bills);
  const month = currentMonth();

  let created = 0;

  customers.forEach(c => {
    const exists = bills.some(b => b.customerId === c.id && b.month === month);
    if (!exists) {
      bills.push({
        id: Date.now() + Math.floor(Math.random() * 9999),
        customerId: c.id,
        customerName: c.name,
        mobile: c.mobile,
        month,
        amount: Number(c.bill),
        paidAmount: 0,
        status: "Unpaid",
        createdAt: new Date().toISOString()
      });
      created++;
    }
  });

  setData(LS.bills, bills);

  if (created) {
    toast(`${created} টি বিল তৈরি হয়েছে`);
  } else {
    toast("এই মাসের বিল আগেই তৈরি করা আছে");
  }

  renderBillsPage();
  renderDashboard();
}

function setupBillsPage() {
  if (document.body.dataset.page !== "bills") return;

  let filter = "All";
  const search = document.getElementById("billSearch");

  search.addEventListener("input", () => renderBillsPage(filter, search.value));

  document.querySelectorAll("[data-bill-filter]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-bill-filter]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      filter = btn.dataset.billFilter;
      renderBillsPage(filter, search.value);
    });
  });

  renderBillsPage();
}

function renderBillsPage(filter = "All", query = "") {
  if (document.body.dataset.page !== "bills") return;

  let bills = getData(LS.bills);
  query = query.toLowerCase();

  const paidAmount = bills.reduce((s, b) => s + Number(b.paidAmount || 0), 0);
  const dueAmount = bills.reduce((s, b) => s + Math.max(b.amount - b.paidAmount, 0), 0);
  const partialCount = bills.filter(b => b.status === "Partial").length;

  document.getElementById("billTotal").textContent = bills.length;
  document.getElementById("billPaid").textContent = formatMoney(paidAmount);
  document.getElementById("billDue").textContent = formatMoney(dueAmount);
  document.getElementById("billPartial").textContent = partialCount;

  bills = bills.filter(b => {
    const match = `${b.id} ${b.customerName} ${b.mobile} ${b.month}`.toLowerCase().includes(query);
    const statusMatch = filter === "All" || b.status === filter;
    return match && statusMatch;
  });

  document.getElementById("billsTable").innerHTML = bills.length ? bills.map(b => {
    const due = Number(b.amount) - Number(b.paidAmount || 0);
    return `
      <tr>
        <td>#${b.id}</td>
        <td>${b.customerName}</td>
        <td>${b.mobile}</td>
        <td>${b.month}</td>
        <td>${formatMoney(b.amount)}</td>
        <td>${formatMoney(b.paidAmount)}</td>
        <td>${formatMoney(due)}</td>
        <td><span class="badge ${b.status.toLowerCase()}">${b.status}</span></td>
        <td>
          <div class="action-row">
            <button class="btn-success" onclick="markBillPaid(${b.id})">Paid</button>
            <button class="btn-light" onclick="printInvoice(${b.id})">Print</button>
            <button class="btn-danger" onclick="deleteBill(${b.id})">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join("") : `<tr><td colspan="9">কোনো বিল পাওয়া যায়নি</td></tr>`;
}

function markBillPaid(id) {
  const bills = getData(LS.bills);
  const updated = bills.map(b => b.id == id ? {
    ...b,
    paidAmount: Number(b.amount),
    status: "Paid"
  } : b);

  setData(LS.bills, updated);
  toast("বিল Paid করা হয়েছে");
  renderBillsPage();
}

function deleteBill(id) {
  if (!confirm("এই বিল ডিলিট করবেন?")) return;
  setData(LS.bills, getData(LS.bills).filter(b => b.id != id));
  toast("বিল ডিলিট হয়েছে");
  renderBillsPage();
}

function printInvoice(id) {
  const bill = getData(LS.bills).find(b => b.id == id);
  const settings = getData(LS.settings, defaultSettings);
  if (!bill) return;

  const due = Number(bill.amount) - Number(bill.paidAmount || 0);

  document.getElementById("invoicePrint").innerHTML = `
    <div class="invoice">
      <div class="invoice-head">
        <div>
          <h1>${settings.ispName}</h1>
          <p>${settings.ispAddress}</p>
          <p>Mobile: ${settings.ispMobile}</p>
        </div>
        <div class="invoice-logo">BFN</div>
      </div>

      <h2>Internet Bill Invoice</h2>
      <p><b>Invoice ID:</b> #${bill.id}</p>
      <p><b>Date:</b> ${new Date().toLocaleDateString("en-GB")}</p>

      <div class="invoice-table">
        <h3>Customer Info</h3>
        <table>
          <tr><th>Name</th><td>${bill.customerName}</td></tr>
          <tr><th>Mobile</th><td>${bill.mobile}</td></tr>
          <tr><th>Month</th><td>${bill.month}</td></tr>
        </table>
      </div>

      <div class="invoice-table">
        <h3>Bill Details</h3>
        <table>
          <tr><th>Total Amount</th><td>${formatMoney(bill.amount)}</td></tr>
          <tr><th>Paid Amount</th><td>${formatMoney(bill.paidAmount)}</td></tr>
          <tr><th>Due Amount</th><td>${formatMoney(due)}</td></tr>
          <tr><th>Status</th><td>${bill.status}</td></tr>
        </table>
      </div>

      <div class="invoice-table">
        <h3>Payment Numbers</h3>
        <p>bKash: ${settings.bkash}</p>
        <p>Nagad: ${settings.nagad}</p>
        <p>Rocket: ${settings.rocket}</p>
      </div>

      <br><br>
      <p>ধন্যবাদ BFN ISP Billing Bangladesh ব্যবহার করার জন্য।</p>
    </div>
  `;

  window.print();
}

function setupSettings() {
  const form = document.getElementById("settingsForm");
  if (!form) return;

  const settings = getData(LS.settings, defaultSettings);
  const admin = getData(LS.admin, { username: "admin", password: "1234" });

  form.ispName.value = settings.ispName || "";
  form.ispMobile.value = settings.ispMobile || "";
  form.ispAddress.value = settings.ispAddress || "";
  form.bkash.value = settings.bkash || "";
  form.nagad.value = settings.nagad || "";
  form.rocket.value = settings.rocket || "";
  form.adminUsername.value = admin.username || "admin";
  form.adminPassword.value = admin.password || "1234";

  form.addEventListener("submit", e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));

    setData(LS.settings, {
      ispName: data.ispName,
      ispMobile: data.ispMobile,
      ispAddress: data.ispAddress,
      bkash: data.bkash,
      nagad: data.nagad,
      rocket: data.rocket
    });

    setData(LS.admin, {
      username: data.adminUsername,
      password: data.adminPassword
    });

    toast("সেটিংস সেভ হয়েছে");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initDefaultData();
  authGuard();
  setCurrentDate();
  setupLogin();
  renderDashboard();
  setupCustomersPage();
  setupAddCustomer();
  setupEditCustomer();
  setupBillsPage();
  setupSettings();
});
