// CONFIG
const CONFIG = {
  wallets:{mvola:{num:"0347451051",name:"Julio Landry",logo:"Mvola"},orange:{num:"0324923117",name:"Julio Landry",logo:"Orange"},airtel:{num:"0331483290",name:"Julio RANDRIANARIMANANA",logo:"Airtel"}},
  cryptoAddrs:{BTC:"bc1-EXAMPLE-BTC",ETH:"0xEXAMPLEETH",USDT:"TEXAMPLEUSDT"},
  ratesMGA:{BTC:150000000,ETH:9000000,USDT:4500},fees:{depot:0.003,retrait:0.005,transfert:0.004},
  primarySelection:["BTC","ETH","USDT"],extraSelection:["LTC","BCH","ADA"]
};

// State
let currentSelection="BTC", transferTarget="USDT", payChoice="mvola", showExtraSelection=false;

// Elements
const $ = s=>document.querySelector(s);
const $$ = s=>document.querySelectorAll(s);

// Tabs
$$(".tab").forEach(t=>{
  t.addEventListener("click",()=>{
    $$(".tab").forEach(x=>x.setAttribute("aria-selected","false"));
    t.setAttribute("aria-selected","true");
    $("#panel-depot").hidden = t.dataset.tab!=="depot";
    $("#panel-retrait").hidden = t.dataset.tab!=="retrait";
    $("#panel-transfert").hidden = t.dataset.tab!=="transfert";
    refreshAll();
  });
});

// Pay buttons
$("#dep-pay-opts").addEventListener("click",(e)=>{
  const btn = e.target.closest(".paybtn"); if(!btn) return;
  payChoice=btn.dataset.pay;
  $$("#dep-pay-opts .paybtn").forEach(b=>b.setAttribute("aria-pressed",b.dataset.pay===payChoice?"true":"false"));
  $("#dep-pay-dest").textContent = CONFIG.wallets[payChoice].num;
  $("#dep-pay-name").textContent = CONFIG.wallets[payChoice].name;
});

// Amount input events
$("#dep-amount-ariary").addEventListener("input",refreshDepot);
$("#ret-amount-send").addEventListener("input",refreshRetrait);
$("#ret-phone").addEventListener("input",refreshRetrait);
$("#trf-amount-top").addEventListener("input",refreshTransfer);

// Unified Strip
function chip(label, active, onClick){
  const b=document.createElement("button");
  b.className = "chip";
  b.textContent = label;
  b.setAttribute("aria-pressed",active?"true":"false");
  b.addEventListener("click",()=>{ currentSelection=label; refreshAll(); });
  return b;
}
function renderUnifiedStrip(){
  const strip=$("#unifiedStrip");
  strip.innerHTML="";
  CONFIG.primarySelection.forEach(c=>strip.appendChild(chip(c,c===currentSelection)));
}

// Depot refresh
function refreshDepot(){
  const amountAriary = parseFloat($("#dep-amount-ariary").value)||0;
  const rate = CONFIG.ratesMGA[currentSelection]||1;
  const fee = CONFIG.fees.depot;
  const amountCrypto = amountAriary*(1-fee)/rate;
  $("#dep-amount-crypto").value = amountCrypto.toFixed(8);
  $("#dep-receive-unit").textContent = currentSelection;
  $("#dep-rate-note").textContent = `1 ${currentSelection} ≈ ${rate.toLocaleString()} MGA`;
  $("#dep-fee-note").textContent = `Fee: ${fee*100}%`;
}

// Retrait refresh
function detectWallet(phone){
  const prefix = phone.substring(0,3);
  for(const [k,v] of Object.entries(CONFIG.wallets)){if(v.num.startsWith(prefix))return k;}
  return "mvola";
}
function refreshRetrait(){
  const amount = parseFloat($("#ret-amount-send").value)||0;
  const rate = CONFIG.ratesMGA[currentSelection]||1;
  const fee = CONFIG.fees.retrait;
  const amountAriary = amount*(1-fee)*rate;
  $("#ret-amount-ariary").value=Math.round(amountAriary).toLocaleString();
  const phone=$("#ret-phone").value.trim();
  const wallet=detectWallet(phone);
  $("#ret-wallet-icon").textContent=phone.length>0?wallet:"Mobile Money";
  $("#ret-our-addr").value = CONFIG.cryptoAddrs[currentSelection];
  $("#ret-rate-note").textContent=`1 ${currentSelection} ≈ ${rate.toLocaleString()} MGA`;
  $("#ret-fee-note").textContent=`Fee: ${fee*100}%`;
}

// Transfer refresh
function refreshTransfer(){
  const amount=parseFloat($("#trf-amount-top").value)||0;
  const rateSource = CONFIG.ratesMGA[currentSelection]||1;
  const rateTarget = CONFIG.ratesMGA[transferTarget]||1;
  const fee = CONFIG.fees.transfert;
  const amountTarget = amount*rateSource/rateTarget*(1-fee);
  $("#trf-amount-bot").value = amountTarget.toFixed(8);
  $("#trf-top-suffix").textContent=currentSelection;
  $("#trf-bot-suffix").textContent=transferTarget;
  $("#trf-rate-note").textContent=`1 ${currentSelection} ≈ ${(rateSource/rateTarget*(1-fee)).toFixed(4)} ${transferTarget}`;
  $("#trf-our-addr").value = CONFIG.cryptoAddrs[currentSelection];
}

// Main refresh
function refreshAll(){
  renderUnifiedStrip();
  refreshDepot();
  refreshRetrait();
  refreshTransfer();
}

// Crypto selector (rates dropdown)
$("#crypto-selector-btn").addEventListener("click",()=>{
  $("#crypto-dropdown").classList.toggle("open");
});
CONFIG.primarySelection.concat(CONFIG.extraSelection).forEach(sym=>{
  const div=document.createElement("div");
  div.className="crypto-item";
  div.textContent=sym;
  div.addEventListener("click",()=>{
    currentSelection=sym;
    $("#crypto-dropdown").classList.remove("open");
    refreshAll();
  });
  $("#crypto-dropdown").appendChild(div);
});

// Init
document.addEventListener("DOMContentLoaded",()=>{ refreshAll(); });
