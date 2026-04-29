const DEFAULT_LOGO = "https://via.placeholder.com/90?text=ISP";

function getSettings(){
  return JSON.parse(localStorage.getItem("settings")) || {
    ispName:"BFN ISP Billing Bangladesh",
    logoUrl:DEFAULT_LOGO,
    bkash:"",
    nagad:"",
    rocket:""
  };
}

function saveSettings(data){
  localStorage.setItem("settings", JSON.stringify(data));
}

function getCustomers(){
  return JSON.parse(localStorage.getItem("customers")) || [];
}

function saveCustomers(data){
  localStorage.setItem("customers", JSON.stringify(data));
}

function getBills(){
  return JSON.parse(localStorage.getItem("bills")) || [];
}

function saveBills(data){
  localStorage.setItem("bills", JSON.stringify(data));
}

function protect(){
  if(localStorage.getItem("loggedIn") !== "true"){
    window.location.href = "login.html";
  }
}

function logout(){
  localStorage.removeItem("loggedIn");
  window.location.href = "login.html";
}

function renderCommon(){
  const s = getSettings();
  document.querySelectorAll(".isp-name").forEach(e => e.innerText = s.ispName);
  document.querySelectorAll(".isp-logo").forEach(e => e.src = s.logoUrl || DEFAULT_LOGO);
}

function money(n){
  return "৳" + Number(n || 0).toLocaleString("bn-BD");
}
