/* ================== CONFIG (English) ================== */
const CONFIG = {
  // ---- EmailJS (DEMO values) ----
  emailjsPublicKey : "DEMO_PUBLIC_KEY_REPLACE_ME",
  emailjsServiceId : "DEMO_SERVICE_ID",
  emailjsTemplateId: "DEMO_TEMPLATE_ID",
  // ---- Contact links ----
  emailTo   : "contact@takalocash.mg",
  phoneCall : "+261347451051",
  facebook  : "https://facebook.com/",
  whatsapp  : "https://wa.me/261347451051",
  // ---- Our receiving addresses / IDs ----
  wallets: {
    // Mobile money numbers
    mvola : {label:"Mvola",  num:"0347451051", name:"Julio Landry", logo:"Mvola"},
    orange: {label:"Orange Money", num:"0324923117", name:"Julio Landry", logo:"Orange"},
    airtel: {label:"Airtel Money", num:"0331483290", name:"Julio RANDRIANARIMANANA", logo:"Airtel"},
    // eWallets (Using fiat symbols for logo/unit)
    wise:   {label:"Wise",   addr:"WISE-ACCOUNT-ID-EXEMPLE",    name:"TakaloCash", unit:"$"},
    paypal: {label:"PayPal", addr:"paypal@takalocash.mg",       name:"TakaloCash", unit:"$"},
    skrill: {label:"Skrill", addr:"skrill@takalocash.mg",       name:"TakaloCash", unit:"€"},
    payoneer:{label:"Payoneer", addr:"PAYONEER-ID-EXEMPLE",     name:"TakaloCash", unit:"$"}
  },
  cryptoAddrs: {
    BTC:"bc1-EXEMPLE-BTC-ADDRESS", ETH:"0xEXEMPLEETHADDRESS", LTC:"ltc1qEXEMPLE", BCH:"qzEXEMPLEBCH",
    USDT:"TEXEMPLEUSDT", USDC:"0xEXEMPLEUSDC", BUSD:"0xEXEMPLEBUSD", DAI:"0xEXEMPLEDAI",
    ADA:"addr1EXEMPLEADA", SOL:"SoLExemple1111", DOT:"dotEXEMPLE", LINK:"0xEXEMPLELINK", UNI:"0xEXEMPLEUNI", CAKE:"0xEXEMPLECAKE"
  },
  // Mobile money prefix detection for Withdrawal
  mobilePrefixes: {
    mvola: ['034', '038'], airtel: ['033'], orange: ['032', '037']
  },
  // Combined primary and extra selection lists
  primarySelection: ["BTC","ETH","USDT","wise","paypal"], 
  extraSelection: ["LTC","BCH","USDC","BUSD","DAI","ADA","SOL","DOT","LINK","UNI","CAKE","skrill","payoneer"],

  // rates: 1 unit = MGA (example)
  ratesMGA: {
    BTC:150_000_000, ETH:9_000_000, LTC:350_000, BCH:2_800_000,
    USDT:4_500, USDC:4_500, BUSD:4_500, DAI:4_500,
    ADA:1_200, SOL:700_000, DOT:120_000, LINK:80_000, UNI:60_000, CAKE:30_000,
    USD:4_400, EUR:4_800 // FIAT rates
  },
  fees: { depot:0.003, retrait:0.005, transfert:0.004 },
  
  // New: Instruction texts for info icons
  infoTexts: {
    rates: "View live exchange rates and volatility.",
    depot_send: "Enter the Ariary amount you wish to send via mobile money.",
    // ... (rest of infoTexts remain the same) ...
  }
};

/* ================== INIT ================== */
(function(){
  if(window.emailjs){
    try{ emailjs.init({publicKey: CONFIG.emailjsPublicKey}); }catch(e){}
  }
})();
const $ = s=>document.querySelector(s);
const $$ = s=>document.querySelectorAll(s);
function toast(msg, ms=2500){ const t=$("#toast"); t.textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"), ms); }

/* ===== State ===== */
let currentLang="en";
let currentSelection="BTC";       // BTC, ETH, paypal, wise... (Source for Depot/Withdrawal, Source for Transfer)
let transferTarget="USDT";        // Target for Transfer
let payChoice="mvola";            // Mobile money choice (Depot source / Withdrawal target)
let showExtraSelection=false;
let withdrawalWallet="mvola";     // The detected/selected wallet for withdrawal reception

/* ===== Utility Functions ===== */
// Checks if the key is a crypto symbol
function isCrypto(key) {
  return CONFIG.cryptoAddrs.hasOwnProperty(key);
}
// Gets the display unit (symbol or fiat symbol)
function getUnit(key) {
    if (isCrypto(key)) return key;
    if (CONFIG.wallets[key]?.unit) return CONFIG.wallets[key].unit;
    return key; // Fallback
}
// Gets the address/ID for a key (crypto or e-wallet)
function getAddress(key) {
    if (isCrypto(key)) return CONFIG.cryptoAddrs[key];
    if (CONFIG.wallets[key]?.addr) return CONFIG.wallets[key].addr;
    return CONFIG.wallets[key]?.num || "N/A";
}
// Gets the MGA rate for a key
function getRateMGA(key) {
    if (isCrypto(key)) return CONFIG.ratesMGA[key];
    // For e-wallets, use the associated fiat rate (e.g., USD or EUR)
    const unit = CONFIG.wallets[key]?.unit;
    if (unit) {
        // Map $ -> USD and € -> EUR for rate lookup
        const rateKey = unit.replace('$', 'USD').replace('€', 'EUR');
        return CONFIG.ratesMGA[rateKey] || 0;
    }
    return 0;
}

/* ===== Build selectable chips (same as previous but more robust) ===== */
function chip(label, active, onClick, isExpander=false){
  const b=document.createElement("button");
  
  if (isExpander) {
    b.className = "expand-inline-btn";
    b.classList.toggle("open", active);
    b.innerHTML = `<svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`;
  } else {
    // Determine class for crypto or e-wallet
    b.className = isCrypto(label) ? "chip" : "ewbtn";
    b.textContent = isCrypto(label) ? label : (CONFIG.wallets[label]?.label || label);
  }
  
  b.setAttribute("aria-pressed", active?"true":"false");
  b.addEventListener("click", onClick);
  return b;
}

/* ===== Render Unified Strip Fix (Essential fix for chips not appearing) ===== */
function renderUnifiedStrip(mode="depot"){
  let activeSelectionKey = (mode === "transfert") ? transferTarget : currentSelection;
  
  const handleSelectionClick = (key, mode) => {
    if(mode === "transfert"){
      transferTarget = key;
    } else {
      currentSelection = key;
    }
    refreshAll();
  };
  
  const renderStrip = (stripEl, list, isTargetStrip) => {
    if (!stripEl) return;
    stripEl.innerHTML = "";
    
    // Add items
    list.forEach(key=>{
      // Active chip depends on the state variable for that strip
      stripEl.appendChild(chip(key, key===activeSelectionKey, ()=>handleSelectionClick(key, isTargetStrip ? 'transfert' : mode)));
    });
    
    // Add expander button to the primary strip
    if (!isTargetStrip && stripEl.id === 'unifiedStrip') {
        const expander = chip(null, showExtraSelection, toggleSelection, true);
        stripEl.appendChild(expander);
    }
  };
  
  const toggleSelection = () => { showExtraSelection=!showExtraSelection; renderUnifiedStrip(getActiveTab()); };

  // --- 1. Source Selection Strip (Used for Depot, Withdrawal, and Transfer Source) ---
  const primaryStrip = $("#unifiedStrip");
  const extraStrip = $("#unifiedStripExtra");
  
  renderStrip(primaryStrip, CONFIG.primarySelection, false);
  if (extraStrip) {
      extraStrip.style.display = showExtraSelection ? 'flex' : 'none';
      renderStrip(extraStrip, CONFIG.extraSelection, false);
  }

  // --- 2. Transfer Target Selection Strip (Used only for Transfer Target) ---
  if (mode === 'transfert') {
      // Re-set the active selection to the target for rendering the target strip
      activeSelectionKey = transferTarget;
      
      const primaryStripT = $("#unifiedStripTransfer");
      const extraStripT = $("#unifiedStripTransferExtra");

      renderStrip(primaryStripT, CONFIG.primarySelection, true);
      if (extraStripT) {
          extraStripT.style.display = showExtraSelection ? 'flex' : 'none';
          renderStrip(extraStripT, CONFIG.extraSelection, true);
      }
  }
}

/* ===== Crypto Selector (Rates dropdown) (Logic remains the same) ===== */
function updateCryptoDropdown() {
  const dropdown = $("#crypto-dropdown");
  dropdown.innerHTML = "";
  // Filter ensures only crypto symbols appear in the dropdown
  [...CONFIG.primarySelection.filter(isCrypto), ...CONFIG.extraSelection.filter(isCrypto)].forEach(sym => {
    const item = document.createElement("div");
    item.className = "crypto-item";
    if (sym === currentSelection) item.classList.add("active");
    item.innerHTML = `
      <span>${sym}</span>
      <span class="crypto-rate">${CONFIG.ratesMGA[sym]?.toLocaleString() || '...'} MGA</span>
    `;
    item.addEventListener("click", () => {
      currentSelection = sym;
      $("#crypto-selector-btn").classList.remove("open");
      dropdown.classList.remove("open");
      refreshAll();
    });
    dropdown.appendChild(item);
  });
}
function setupCryptoSelector() {
  const selectorBtn = $("#crypto-selector-btn");
  const dropdown = $("#crypto-dropdown");
  selectorBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    selectorBtn.classList.toggle("open");
    dropdown.classList.toggle("open");
  });
  document.addEventListener("click", (e) => {
    if (!selectorBtn.contains(e.target) && !dropdown.contains(e.target)) {
      selectorBtn.classList.remove("open");
      dropdown.classList.remove("open");
    }
  });
  updateCryptoDropdown();
}
function updateCurrentRateDisplay() {
  const display = $("#current-rate-display");
  const fiatDisplay = $("#fiat-rate-display");
  
  // 1. Current Crypto Rate
  // If the selection is an e-wallet, default to BTC rate display
  const rateKey = isCrypto(currentSelection) ? currentSelection : 'BTC'; 
  const rateMGA = CONFIG.ratesMGA[rateKey];
  if (rateKey && rateMGA) {
    display.textContent = `1 ${rateKey} = ${rateMGA.toLocaleString()} MGA`;
  } else {
    display.textContent = "Loading...";
  }

  // 2. FIAT Rates
  const rateUSD = CONFIG.ratesMGA.USD || '...';
  const rateEUR = CONFIG.ratesMGA.EUR || '...';
  fiatDisplay.textContent = `1 $ = ${rateUSD.toLocaleString()} MGA | 1 € = ${rateEUR.toLocaleString()} MGA`;
}

/* ===== Rates Fetching (remains the same) ===== */
const cryptoMapping = {}; // (As before)
const fallbackRates = {}; // (As before)
let ratesUSD = {};
async function fetchRate(sym){
  //... (as before)
}
async function updateRates(){
  //... (as before)
  refreshAll();
}

/* ===== Tabs and other event listeners (remain the same) ===== */
function getActiveTab() {
  return $(".tab[aria-selected='true']").dataset.tab;
}
$$(".tab").forEach(t=>{
  t.addEventListener("click",()=>{
    $$(".tab").forEach(x=>x.setAttribute("aria-selected","false"));
    t.setAttribute("aria-selected","true");
    const tab=t.dataset.tab;
    $("#panel-depot").hidden = tab!=="depot";
    $("#panel-retrait").hidden = tab!=="retrait";
    $("#panel-transfert").hidden = tab!=="transfert";
    // Reset expanders when changing tab
    showExtraSelection=false;
    refreshAll();
  });
});

$("#dep-pay-opts").addEventListener("click",(e)=>{
  const btn=e.target.closest(".paybtn"); if(!btn) return;
  payChoice = btn.dataset.pay;
  $$("#dep-pay-opts .paybtn").forEach(b=>b.setAttribute("aria-pressed", b.dataset.pay===payChoice?"true":"false"));
  updateDepotDest();
});

["dep","ret","trf"].forEach(k=>{
  $(`#${k}-accept`).addEventListener("change",()=>{ $(`#${k}-preview`).disabled = ! $(`#${k}-accept`).checked; });
});

$("#ret-copy").addEventListener("click",()=>{ $("#ret-our-addr").select(); document.execCommand("copy"); toast("Copied!"); });
$("#trf-copy").addEventListener("click",()=>{ $("#trf-our-addr").select(); document.execCommand("copy"); toast("Copied!"); });

/* ---------------------------------
 * MAIN REFRESH FUNCTIONS
 * --------------------------------- */

// Deposit specific refresh
function updateDepotDest(){
  const destEl = $("#dep-pay-dest");
  const nameEl = $("#dep-pay-name");
  
  const wallet = CONFIG.wallets[payChoice];
  destEl.textContent = wallet.num || wallet.addr;
  nameEl.textContent = wallet.name;
}
function refreshDepot(){
  const target = currentSelection; // Crypto or E-wallet
  const amountAriary = parseFloat($("#dep-amount-ariary").value) || 0;
  
  let rateTarget = getRateMGA(target);
  const feeRate = CONFIG.fees.depot;

  const amountAfterFeeAriary = amountAriary * (1 - feeRate);
  let amountTarget = 0;
  let unitTarget = getUnit(target);
  let rateNote = `1 ${unitTarget} = ... MGA (Rate loading)`; // Informative fallback
  
  if (rateTarget > 0) {
    amountTarget = amountAfterFeeAriary / rateTarget;
    rateNote = `1 ${unitTarget} ≈ ${rateTarget.toLocaleString()} MGA`;
  }
  
  // Update UI fields
  // Fix: Ensure fixed to 8 decimal places for crypto, 2 for fiat (e-wallets)
  $("#dep-amount-crypto").value = amountTarget.toFixed(isCrypto(target) ? 8 : 2);
  $("#dep-receive-unit").textContent = unitTarget;
  $("#dep-rate-note").textContent = rateNote;
  $("#dep-fee-note").textContent = `Fee: ${feeRate*100}%`;
  
  $("#dep-addr-label").firstChild.textContent = `Your ${unitTarget} Address`;
  $("#dep-addr").placeholder = `Your ${unitTarget} Address/ID`;

  updateDepotDest();
}

// Withdrawal specific refresh
function detectMobileWallet(phoneNumber) {
  const prefix = phoneNumber.substring(0, 3);
  for (const [walletKey, prefixes] of Object.entries(CONFIG.mobilePrefixes)) {
    if (prefixes.includes(prefix)) {
      return walletKey;
    }
  }
  return null;
}

function refreshRetrait(){
  const source = currentSelection; // Crypto or E-wallet
  const amountSource = parseFloat($("#ret-amount-send").value) || 0;
  
  const rateSource = getRateMGA(source);
  const feeRate = CONFIG.fees.retrait;
  
  const amountAfterFeeSource = amountSource * (1 - feeRate);
  const amountAriary = amountAfterFeeSource * rateSource; // Conversion
  
  let unitSource = getUnit(source);
  let rateNote = `1 ${unitSource} = ... MGA (Rate loading)`; // Informative fallback
  
  if (rateSource > 0) {
    rateNote = `1 ${unitSource} ≈ ${rateSource.toLocaleString()} MGA`;
  }

  // 1. Update Wallet based on phone number (Fix for the three dots detection)
  const phoneInput = $("#ret-phone");
  const phoneNum = phoneInput.value.trim();
  const detectedWallet = detectMobileWallet(phoneNum);
  
  const walletIcon = $("#ret-wallet-icon");
  if (phoneNum.length >= 3 && detectedWallet) {
    withdrawalWallet = detectedWallet;
    // Show the logo name (Mvola / Airtel / Orange)
    walletIcon.textContent = CONFIG.wallets[withdrawalWallet]?.logo || detectedWallet;
  } else {
    // Show '...' only when typing starts, otherwise show default 'Mobile Money'
    walletIcon.textContent = phoneNum.length > 0 ? '...' : 'Mobile Money';
    // Use the default mvola for calculation if not detected
    withdrawalWallet = 'mvola'; 
  }
  
  // 2. Update UI
  $("#ret-amount-ariary").value = Math.round(amountAriary).toLocaleString(); // Only the number, MGA is the suffix
  $("#ret-send-unit").textContent = unitSource;
  $("#ret-rate-note").textContent = rateNote;
  $("#ret-fee-note").textContent = `Fee: ${feeRate*100}%`;
  
  $("#ret-our-addr").value = getAddress(source);
  $("#ret-currency-only").innerHTML = `Send only in <b>${unitSource}</b>`;
}

// Transfer specific refresh
function refreshTransfer(){
  const source = currentSelection; // Source Crypto or E-wallet
  const target = transferTarget;   // Target Crypto or E-wallet
  
  const amountSource = parseFloat($("#trf-amount-top").value) || 0;
  
  const rateSourceMGA = getRateMGA(source);
  const rateTargetMGA = getRateMGA(target);
  const feeRate = CONFIG.fees.transfert;
  
  let amountTarget = 0;
  let unitSource = getUnit(source);
  let unitTarget = getUnit(target);
  let displayRateNote = `1 ${unitSource} = ... ${unitTarget} (Rate loading)`; // Informative fallback
  
  if (rateSourceMGA > 0 && rateTargetMGA > 0) {
    const amountMGA = amountSource * rateSourceMGA;
    const amountTargetRaw = amountMGA / rateTargetMGA;
    amountTarget = amountTargetRaw * (1 - feeRate);

    const cryptoToCryptoRate = (rateSourceMGA / rateTargetMGA) * (1 - feeRate);
    displayRateNote = `1 ${unitSource} ≈ ${cryptoToCryptoRate.toFixed(4)} ${unitTarget}`;
  }

  // Update SEND fields
  $("#trf-amount-top").value = amountSource.toFixed(isCrypto(source) ? 8 : 2);
  $("#trf-top-suffix").textContent = unitSource;
  $("#trf-top-note").textContent = `Source: ${unitSource}`;
  $("#trf-our-addr").value = getAddress(source);
  
  // Update RECEIVE fields
  $("#trf-amount-bot").value = amountTarget.toFixed(isCrypto(target) ? 8 : 2);
  $("#trf-bot-suffix").textContent = unitTarget;
  $("#trf-rate-note").textContent = displayRateNote;
  $("#trf-dest-addr").placeholder = `Your ${unitTarget} Address/ID`;
}

// Main refresh orchestrator
function refreshAll(){
  updateCurrentRateDisplay();
  
  const activeTab = getActiveTab();
  renderUnifiedStrip(activeTab); // Render chips based on active tab and expander state
  
  if (activeTab === "depot") refreshDepot();
  if (activeTab === "retrait") refreshRetrait();
  if (activeTab === "transfert") refreshTransfer();
}

/* ===== Event Listeners for Dynamic Refresh ===== */
$("#dep-amount-ariary").addEventListener("input", refreshDepot);
$("#ret-amount-send").addEventListener("input", refreshRetrait);
$("#ret-phone").addEventListener("input", refreshRetrait);
$("#trf-amount-top").addEventListener("input", refreshTransfer);

// Initial call on load
document.addEventListener("DOMContentLoaded", () => {
  setupCryptoSelector();
  updateRates(); // Start fetching live rates and then calls refreshAll()
});

// ... (Other event listeners for modals/CTAs) ...
