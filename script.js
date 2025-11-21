here/* ================== CONFIG (French/Malagasy) ================== */
const CONFIG = {
// ---- EmailJS (DEMO values) ----
emailjsPublicKey : "DEMO_PUBLIC_KEY_REPLACE_ME",
emailjsServiceId : "DEMO_SERVICE_ID",
emailjsTemplateId: "DEMO_TEMPLATE_ID",
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
ADA:"addr1EXEMPLEADA", SOL:"SoLExemple1111", DOT:"dotEXEMPLE", LINK:"80_000", UNI:"60_000", CAKE:"30_000"
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
fees: { depot:0.003, retrait:0.005, transfert:0.004 }
};

/* ================== INIT ================== */
(function(){
if(window.emailjs){
try{ emailjs.init({publicKey: CONFIG.emailjsPublicKey}); }catch(e){}
}
})();
const $ = s=>document.querySelector(s);
const $$ = s=>document.querySelectorAll(s);
function toast(msg, ms=4000){ const t=$("#toast"); t.textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"), ms); }

/* ===== State ===== */
let currentSelection="BTC";       
let transferTarget="USDT";        
let payChoice="mvola";            
let showExtraSelection=false;
let withdrawalWallet="mvola";     

/* ===== Utility Functions ===== */
function isCrypto(key) {
  return CONFIG.cryptoAddrs.hasOwnProperty(key);
}
function getUnit(key) {
    if (isCrypto(key)) return key;
    if (CONFIG.wallets[key]?.unit) return CONFIG.wallets[key].unit;
    return key; 
}
function getAddress(key) {
    if (isCrypto(key)) return CONFIG.cryptoAddrs[key];
    if (CONFIG.wallets[key]?.addr) return CONFIG.wallets[key].addr;
    return CONFIG.wallets[key]?.num || "N/A";
}
function getRateMGA(key) {
    if (isCrypto(key)) return CONFIG.ratesMGA[key];
    const unit = CONFIG.wallets[key]?.unit;
    if (unit) {
        const rateKey = unit.replace('$', 'USD').replace('€', 'EUR');
        return CONFIG.ratesMGA[rateKey] || 0;
    }
    return 0;
}

/* ===== Build selectable chips ===== */
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

/* ===== Render Unified Strip ===== */
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
    
    list.forEach(key=>{  
      stripEl.appendChild(chip(key, key===activeSelectionKey, ()=>handleSelectionClick(key, isTargetStrip ? 'transfert' : mode)));  
    });  
      
    if ((stripEl.id === 'unifiedStrip' && !isTargetStrip) || (stripEl.id === 'unifiedStripTransfer' && isTargetStrip)) {
        if (!list.includes("LTC") || list.includes("BTC")) { 
            const expander = chip(null, showExtraSelection, toggleSelection, true);
            stripEl.appendChild(expander);
        }
    }
  };
  
  const toggleSelection = () => { showExtraSelection=!showExtraSelection; renderUnifiedStrip(getActiveTab()); };
  
  // --- 1. Source Selection Strip ---
  const primaryStrip = $("#unifiedStrip");
  const extraStrip = $("#unifiedStripExtra");
  
  renderStrip(primaryStrip, CONFIG.primarySelection, false);
  if (extraStrip) {
      extraStrip.style.display = showExtraSelection ? 'flex' : 'none';
      renderStrip(extraStrip, CONFIG.extraSelection, false);
  }

  // --- 2. Transfer Target Selection Strip ---
  if (mode === 'transfert') {
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

/* ===== Crypto Selector (Rates dropdown) ===== */
function updateCryptoDropdown() {
  const dropdown = $("#crypto-dropdown");
  dropdown.innerHTML = "";
  
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
  
  const rateKey = isCrypto(currentSelection) ? currentSelection : 'BTC'; 
  const rateMGA = CONFIG.ratesMGA[rateKey];
  
  if (rateKey && rateMGA) {
    display.textContent = `1 ${rateKey} ≈ ${rateMGA.toLocaleString()} MGA`;
  } else {
    display.textContent = "Chargement...";
  }

  const rateUSD = CONFIG.ratesMGA.USD || '...';
  const rateEUR = CONFIG.ratesMGA.EUR || '...';
  fiatDisplay.textContent = `1 $ = ${rateUSD.toLocaleString()} MGA | 1 € = ${rateEUR.toLocaleString()} MGA`;
}

/* ===== Tabs and other functions ===== */
function getActiveTab() {
  const activeTabElement = $(".tab[aria-selected='true']");
  return activeTabElement ? activeTabElement.dataset.tab : "depot"; 
}

function updateDepotDest(){
  const destEl = $("#dep-pay-dest");
  const nameEl = $("#dep-pay-name");
  const wallet = CONFIG.wallets[payChoice];
  
  destEl.textContent = wallet.num || wallet.addr;
  nameEl.textContent = wallet.name;
}

function refreshDepot(){
  const target = currentSelection; 
  const amountAriary = parseFloat($("#dep-amount-ariary").value) || 0;
  let rateTarget = getRateMGA(target);
  const feeRate = CONFIG.fees.depot;

  const amountAfterFeeAriary = amountAriary * (1 - feeRate);
  let amountTarget = 0;
  let unitTarget = getUnit(target);
  
  let rateNote = `1 ${unitTarget} ≈ ... MGA (Taux en chargement)`;
  
  if (rateTarget > 0) {
    amountTarget = amountAfterFeeAriary / rateTarget;
    rateNote = `1 ${unitTarget} ≈ ${rateTarget.toLocaleString()} MGA`;
  }
  
  $("#dep-amount-crypto").value = amountTarget.toFixed(isCrypto(target) ? 8 : 2);
  $("#dep-receive-unit").textContent = unitTarget;
  $("#dep-rate-note").textContent = rateNote;
  $("#dep-fee-note").textContent = `Frais: ${feeRate*100}%`;
  
  $("#dep-addr-label").textContent = `Votre adresse de réception`; 
  $("#dep-addr").placeholder = `Votre adresse/pièce d'identité`; 
  
  updateDepotDest();
}

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
  const source = currentSelection; 
  const amountSource = parseFloat($("#ret-amount-send").value) || 0;
  const rateSource = getRateMGA(source);
  const feeRate = CONFIG.fees.retrait;
  const amountAfterFeeSource = amountSource * (1 - feeRate);
  const amountAriary = amountAfterFeeSource * rateSource; 
  
  let unitSource = getUnit(source);
  
  let rateNote = `1 ${unitSource} ≈ ... MGA (Taux en chargement)`;
  
  if (rateSource > 0) {
    rateNote = `1 ${unitSource} ≈ ${rateSource.toLocaleString()} MGA`;
  }

  // 1. Update Wallet based on phone number (Detection Logic)
  const phoneInput = $("#ret-phone");
  const phoneNum = phoneInput.value.trim();
  const detectedWallet = detectMobileWallet(phoneNum);
  const walletIcon = $("#ret-wallet-icon");
  $("#ret-our-addr").value = getAddress(source); 
  
  if (phoneNum.length >= 3 && detectedWallet) {
    withdrawalWallet = detectedWallet;
    walletIcon.textContent = CONFIG.wallets[withdrawalWallet]?.logo || detectedWallet;
  } else {
    walletIcon.textContent = phoneNum.length > 0 ? '...' : 'Mobile Money';
    withdrawalWallet = 'mvola'; 
  }
  
  // 2. Update UI
  $("#ret-amount-ariary").value = Math.round(amountAriary).toLocaleString();
  $("#ret-send-unit").textContent = unitSource;
  $("#ret-rate-note").textContent = rateNote;
  $("#ret-fee-note").textContent = `Frais: ${feeRate*100}%`;
  
  $("#ret-currency-only").innerHTML = `Envoyer seulement en <b>${unitSource}</b>`;
}

function refreshTransfer(){
  const source = currentSelection;
  const target = transferTarget;
  const amountSource = parseFloat($("#trf-amount-top").value) || 0;
  
  const rateSourceMGA = getRateMGA(source);
  const rateTargetMGA = getRateMGA(target);
  const feeRate = CONFIG.fees.transfert;
  
  let amountTarget = 0;
  let unitSource = getUnit(source);
  let unitTarget = getUnit(target);
  
  let displayRateNote = `1 ${unitSource} ≈ ... ${unitTarget}`;
  
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
  $("#trf-dest-addr").placeholder = `Adresse de votre wallet / ID`;
}

// Main refresh orchestrator
function refreshAll(){
  updateCurrentRateDisplay();
  
  const activeTab = getActiveTab();
  renderUnifiedStrip(activeTab); 
  
  if (activeTab === "depot") refreshDepot();
  if (activeTab === "retrait") refreshRetrait();
  if (activeTab === "transfert") refreshTransfer();
}

/* ================== PREVIEW HANDLER (NEW) ================== */
function showPreview(mode) {
    let data = { mode: mode, date: new Date().toLocaleString('fr-FR') };

    if (mode === 'depot') {
        data.send = {
            amount: parseFloat($("#dep-amount-ariary").value),
            unit: "MGA",
            method: payChoice,
            dest_num: CONFIG.wallets[payChoice].num,
            dest_name: CONFIG.wallets[payChoice].name
        };
        data.receive = {
            amount: parseFloat($("#dep-amount-crypto").value),
            unit: getUnit(currentSelection),
            address: $("#dep-addr").value
        };
        data.rate = $("#dep-rate-note").textContent.replace('Frais: ', '');
        data.fee = CONFIG.fees.depot;
    } else if (mode === 'retrait') {
        data.send = {
            amount: parseFloat($("#ret-amount-send").value),
            unit: getUnit(currentSelection),
            our_address: getAddress(currentSelection)
        };
        data.receive = {
            amount: parseFloat($("#ret-amount-ariary").value.replace(/\s/g, '')),
            unit: "MGA",
            method: withdrawalWallet,
            phone: $("#ret-phone").value,
            name: $("#ret-name").value
        };
        data.rate = $("#ret-rate-note").textContent.replace('Frais: ', '');
        data.fee = CONFIG.fees.retrait;
    } else if (mode === 'transfert') {
        data.send = {
            amount: parseFloat($("#trf-amount-top").value),
            unit: getUnit(currentSelection),
            our_address: getAddress(currentSelection)
        };
        data.receive = {
            amount: parseFloat($("#trf-amount-bot").value),
            unit: getUnit(transferTarget),
            address: $("#trf-dest-addr").value
        };
        data.rate = $("#trf-rate-note").textContent;
        data.fee = CONFIG.fees.transfert;
    }
    
    // Simple validation
    if (!data.send.amount || data.send.amount <= 0 || !data.receive.amount || data.receive.amount <= 0) {
         return toast("Veuillez entrer des montants valides pour l'opération.");
    }

    // This is where you would normally display a modal/new page with the calculated data.
    // For this demonstration, we use a toast to confirm data retrieval.
    console.log(`Preview Data for ${mode.toUpperCase()}:`, data);
    toast(`Aperçu ${mode.toUpperCase()} : Envoi de ${data.send.amount.toLocaleString()} ${data.send.unit} pour recevoir ${data.receive.amount.toLocaleString()} ${data.receive.unit}. Vérifiez la console pour les détails.`);

    // Optional: Call EmailJS here if required, though typically done on final submission
    // emailjs.send(CONFIG.emailjsServiceId, CONFIG.emailjsTemplateId, data)
    // .then(() => toast("Envoi de la commande..."), (error) => toast("Erreur d'envoi! " + error.text));
}

/* ===== Event Listeners ===== */
// Tab Switching
$$(".tab").forEach(t=>{
  t.addEventListener("click",()=>{
    $$(".tab").forEach(x=>x.setAttribute("aria-selected","false"));
    t.setAttribute("aria-selected","true");
    const tab=t.dataset.tab;
    $("#panel-depot").hidden = tab!=="depot";
    $("#panel-retrait").hidden = tab!=="retrait";
    $("#panel-transfert").hidden = tab!=="transfert";
    showExtraSelection=false;
    refreshAll();
  });
});

// Deposit Pay Options
$("#dep-pay-opts").addEventListener("click",(e)=>{
  const btn=e.target.closest(".paybtn"); if(!btn) return;
  payChoice = btn.dataset.pay;
  $$("#dep-pay-opts .paybtn").forEach(b=>b.setAttribute("aria-pressed", b.dataset.pay===payChoice?"true":"false"));
  updateDepotDest();
});

// Copy Buttons
$("#ret-copy").addEventListener("click",()=>{ $("#ret-our-addr").select(); document.execCommand("copy"); toast("Copié!"); }); 
$("#trf-copy").addEventListener("click",()=>{ $("#trf-our-addr").select(); document.execCommand("copy"); toast("Copié!"); }); 

// Acceptance Checkboxes
["dep","ret","trf"].forEach(k=>{
  const acceptCheckbox = $(`#${k}-accept`);
  const previewButton = $(`#${k}-preview`);

  acceptCheckbox.addEventListener("change",()=>{ previewButton.disabled = !acceptCheckbox.checked; });

  // Attach the showPreview function to the buttons
  previewButton.addEventListener("click", () => showPreview(k));
});

// Input Listeners for Auto-Update
$("#dep-amount-ariary").addEventListener("input", refreshDepot);
$("#ret-amount-send").addEventListener("input", refreshRetrait);
$("#ret-phone").addEventListener("input", refreshRetrait);
$("#trf-amount-top").addEventListener("input", refreshTransfer);

// Initial call on load
document.addEventListener("DOMContentLoaded", () => {
  setupCryptoSelector();
  refreshAll(); 
});
