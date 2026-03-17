
import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const STORAGE_KEY = "creative-manager-perfect-v4";

const templates = [
  {id:"tpl-001", title:"ロゴデザイン基本", category:"ロゴデザイン", hours:24, price:150000, icon:"✎", tasks:[["ヒアリング・構想","4時間"],["ラフスケッチ作成","6時間"],["デザイン制作","8時間"],["修正対応","4時間"],["データ納品","2時間"]]},
  {id:"tpl-002", title:"ウェブサイトデザイン", category:"ウェブデザイン", hours:60, price:500000, icon:"◎", tasks:[["ディレクション","10時間"],["ワイヤーフレーム","12時間"],["トップページ制作","18時間"],["下層ページ制作","14時間"],["レスポンシブ対応","6時間"]]},
  {id:"tpl-003", title:"パッケージデザイン", category:"パッケージ", hours:40, price:300000, icon:"▣", tasks:[["コンセプト設計","8時間"],["デザイン制作","12時間"],["展開パターン作成","8時間"],["入稿データ作成","8時間"],["最終確認","4時間"]]},
  {id:"tpl-004", title:"広告バナー制作", category:"広告デザイン", hours:12, price:80000, icon:"▤", tasks:[["構成・コピー確認","2時間"],["デザイン制作","6時間"],["リサイズ対応","3時間"],["最終確認・納品","1時間"]]},
];

const initialStaff = [
  { id:"st-001", name:"上部 栞絵太", role:"ウェブエンジニア", email:"cweb@design.co.jp", hoursPerDay:8, skills:["ウェブデザイン","インデックス","CSS制作"], status:"稼働中" },
  { id:"st-002", name:"田中 太郎", role:"ディレクター", email:"tanaka@design.co.jp", hoursPerDay:8, skills:["ディレクション","ブランディング","クライアント対応"], status:"稼働中" },
  { id:"st-003", name:"佐藤 花子", role:"デザイナー", email:"sato@design.co.jp", hoursPerDay:8, skills:["ウェブデザイン","UIデザイン","ロゴデザイン"], status:"稼働中" },
  { id:"st-004", name:"鈴木 一郎", role:"イラストレーター", email:"suzuki@design.co.jp", hoursPerDay:8, skills:["イラスト","パッケージデザイン","キャラクターデザイン"], status:"稼働中" },
  { id:"st-005", name:"高橋 美咲", role:"ウェブエンジニア", email:"takahashi@design.co.jp", hoursPerDay:8, skills:["インデックス","WordPress","レスポンシブ"], status:"稼働中" },
];

let state = {
  currentPage: "dashboard",
  orders: [],
  staff: JSON.parse(JSON.stringify(initialStaff)),
  settings: { companyName: "チャッピー株式会社", autoMail: true, autoOutsource: true, lineReady: true },
  samplePool: [],
  staffEditing: null,
};

const $ = (s)=>document.querySelector(s);
const $$ = (s)=>document.querySelectorAll(s);

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    orders: state.orders,
    staff: state.staff,
    settings: state.settings,
    samplePool: state.samplePool
  }));
}
function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw){
    state.samplePool = createSamplePool();
    return;
  }
  try{
    const parsed = JSON.parse(raw);
    state.orders = parsed.orders || [];
    state.staff = parsed.staff || JSON.parse(JSON.stringify(initialStaff));
    state.settings = parsed.settings || state.settings;
    state.samplePool = parsed.samplePool || createSamplePool();
  }catch{
    state.samplePool = createSamplePool();
  }
}

function yen(v){ return new Intl.NumberFormat("ja-JP",{style:"currency",currency:"JPY",maximumFractionDigits:0}).format(v); }
function randomFrom(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function createSamplePool(){
  const clients = ["チャッピー株式会社","鳥取デザイン工房","ソラミチ企画","日本海フーズ","株式会社ライト","KKKスポーツ","山陰テック","砂丘観光PR","Blue Note","未来建設"];
  const projectWords = ["春キャンペーン","採用LP","新商品告知","周年ロゴ","Instagram広告","会社案内","展示会パネル","パッケージ刷新","ECバナー","イベントチラシ"];
  const deliverables = ["AI / PNG","Figma / PDF","PSD / JPG","AI / SVG / PNG","XD / PDF"];
  const priorities = ["通常","高","特急"];
  const pool = [];
  for(let i=0;i<30;i++){
    const tpl = templates[i % templates.length];
    pool.push({
      client: clients[Math.floor(i / templates.length) % clients.length],
      clientEmail: `sample${i+1}@example.jp`,
      templateId: tpl.id,
      details: `${tpl.title}をベースにしたランダムサンプル案件です。`,
      deadlineOffset: 3 + (i % 18),
      amount: String(tpl.price + (i % 5) * 20000),
      projectName: `${projectWords[i % projectWords.length]} ${i+1}`,
      priority: priorities[i % priorities.length],
      deliverable: randomFrom(deliverables),
      revisionCount: String((i % 3) + 1),
      memo: "サンプル自動生成",
      source: "サンプル案件",
    });
  }
  return pool;
}

function pageTitle(){
  return {
    dashboard:"ダッシュボード",
    orders:"受注管理",
    templates:"テンプレート",
    staff:"スタッフ",
    reports:"日程",
    outsource:"外注管理"
  }[state.currentPage];
}

function calcWorkingDays(start, end){
  if(!start || !end) return 0;
  const s = new Date(start), e = new Date(end);
  if(isNaN(s) || isNaN(e) || e < s) return 0;
  let count=0;
  const c = new Date(s);
  while(c <= e){
    const day = c.getDay();
    if(day!==0 && day!==6) count++;
    c.setDate(c.getDate()+1);
  }
  return count;
}
function addBusinessDays(dateStr, days){
  const d = new Date(dateStr);
  if(isNaN(d)) return "-";
  let added=0;
  while(added < days){
    d.setDate(d.getDate()+1);
    const day = d.getDay();
    if(day!==0 && day!==6) added++;
  }
  return d.toISOString().slice(0,10);
}
function toneClassStatus(v){
  if(v==="納期OK") return "ok";
  if(v==="納期NG") return "ng";
  if(v==="納品受信") return "done";
  return "ok";
}
function toneClassJudge(v){
  if(v==="社内対応") return "inner";
  if(v==="外注推奨") return "out";
  if(v==="納品受信") return "done";
  return "inner";
}
function busyHoursByStaff(staffId){
  return state.orders
    .filter(o => o.assigneeId===staffId && o.judge!=="納品受信")
    .reduce((sum,o)=> sum + Number(String(o.estimate).replace(/[^0-9]/g,"") || 0), 0);
}
function pickAssignee(template){
  const skillMap = {
    "ロゴデザイン":["ロゴデザイン","ブランディング"],
    "ウェブデザイン":["ウェブデザイン","UIデザイン","レスポンシブ"],
    "パッケージ":["パッケージデザイン","イラスト"],
    "広告デザイン":["クライアント対応","ウェブデザイン","イラスト"]
  };
  const desired = skillMap[template.category] || [];
  const sorted = [...state.staff].sort((a,b)=>busyHoursByStaff(a.id)-busyHoursByStaff(b.id));
  return sorted.find(s=> desired.some(skill => s.skills.includes(skill))) || sorted[0];
}

function buildOrderPayload(form){
  const template = templates.find(t=>t.id===form.templateId);
  if(!template) return null;
  const assignee = pickAssignee(template);
  const today = new Date().toISOString().slice(0,10);
  const deadline = form.deadline || addBusinessDays(today, 7);
  const workingDays = calcWorkingDays(today, deadline);
  const currentBusy = busyHoursByStaff(assignee.id);
  const internalCapacity = Math.max(workingDays * assignee.hoursPerDay - currentBusy, 0);
  const priorityBoost = form.priority==="特急" ? 1.3 : form.priority==="高" ? 1.15 : 1;
  const adjustedHours = Math.ceil(template.hours * priorityBoost);
  const needOutsource = state.settings.autoOutsource && adjustedHours > internalCapacity;
  const status = needOutsource ? "納期NG" : "納期OK";
  const finish = needOutsource ? deadline : addBusinessDays(today, Math.ceil(adjustedHours / assignee.hoursPerDay));
  const notice = needOutsource
    ? `【要対応】${form.client}様「${form.projectName}」は社内工数を超過する見込みです。外注候補の選定と指示書作成をお願いします。納期: ${deadline} / 想定工数: ${adjustedHours}時間`
    : `【対応可能】${form.client}様「${form.projectName}」は${assignee.name}が担当予定です。納期内に対応可能です。完了見込み: ${finish}`;
  const lineText = needOutsource
    ? `外注対応が必要です\n案件: ${form.projectName}\n顧客: ${form.client}\n納期: ${deadline}\n担当: ${assignee.name}`
    : `新規受注\n案件: ${form.projectName}\n顧客: ${form.client}\n担当: ${assignee.name}\n完了見込み: ${finish}`;
  return {
    id: `OD-${Math.floor(1000+Math.random()*9000)}`,
    client: form.client,
    clientEmail: form.clientEmail || "",
    projectName: form.projectName,
    templateTitle: template.title,
    category: template.category,
    assignee: assignee.name,
    assigneeId: assignee.id,
    estimate: `${adjustedHours}時間`,
    amount: form.amount ? yen(Number(form.amount)) : yen(template.price),
    deadline,
    status,
    judge: needOutsource ? "外注推奨" : "社内対応",
    details: form.details || "",
    notice,
    lineText,
    mailText: `${state.settings.companyName}\n${assignee.name}さん\n\n${notice}`,
    reportItems: template.tasks.map(([task,hours],i)=>({step:i+1, task, hours})),
    startDate: today,
    finishDate: finish,
    outsourceNeeded: needOutsource,
    deliverable: form.deliverable || "AI / PSD / PNG",
    revisionCount: form.revisionCount || "2",
    memo: form.memo || "",
    priority: form.priority || "通常",
    outsourceInstruction: needOutsource ? `【外注指示書】\n顧客名: ${form.client}\n案件名: ${form.projectName}\n納期: ${deadline}\n案件詳細: ${form.details || ""}` : "",
    source: form.source || "新規受注",
  };
}

function setPage(key){
  state.currentPage = key;
  $("#pageTitle").textContent = pageTitle();
  document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));
  $(`#${key}Page`).classList.remove("hidden");
  document.querySelectorAll(".nav-btn").forEach(b=> b.classList.toggle("active", b.dataset.key===key));
  renderPage();
}

function renderNav(){
  const nav = $("#nav");
  nav.innerHTML = "";
  [
    ["dashboard","ダッシュボード","▦"],
    ["orders","受注管理","☰"],
    ["templates","テンプレート","▤"],
    ["staff","スタッフ","◌"],
    ["reports","日程","◫"],
    ["outsource","外注管理","▣"],
  ].forEach(([key,label,icon])=>{
    const btn = document.createElement("button");
    btn.className = "nav-btn";
    btn.dataset.key = key;
    btn.innerHTML = `<span class="nav-left"><span>${icon}</span><span>${label}</span></span><span>›</span>`;
    btn.onclick = ()=>setPage(key);
    nav.appendChild(btn);
  });
}

function renderDashboard(){
  const orders = state.orders;
  const active = orders.filter(o=>o.status!=="納期NG").length;
  const ng = orders.filter(o=>o.status==="納期NG").length;
  const out = orders.filter(o=>o.outsourceNeeded).length;
  $("#dashboardPage").innerHTML = `
    <div class="page-header">
      <div><h1>ダッシュボード</h1><div class="sub">案件の概要と進捗状況</div></div>
      <div class="card"><div class="card-body"><div style="font-weight:700;color:#6d4aff">${state.settings.companyName}</div><div class="sub">LINE文面生成: ${state.settings.lineReady?"ON":"OFF"}</div></div></div>
    </div>
    <div class="stats">
      ${stat("すべてのプロジェクト", orders.length, "登録済み","icon-violet","□")}
      ${stat("進行中", active, "アクティブ","icon-cyan","◔")}
      ${stat("納期NG", ng, "要対応","icon-red","!")}
      ${stat("外注候補", out, "AI判定","icon-orange","↗")}
      ${stat("スタッフ", state.staff.length, "稼働中","icon-gray","○")}
    </div>
    <div class="grid-2-1">
      <div class="card">
        <div class="card-head">最近の受注</div>
        <div class="card-body">
          ${orders.length===0?`<div class="empty-box">受注データなし</div>`:
            `<div class="mini-list">${orders.slice(0,4).map(o=>`
              <div class="mini-order">
                <div><div class="title">${o.client} / ${o.projectName}</div><div class="meta">担当: ${o.assignee} ・ 納期: ${o.deadline}</div></div>
                <div class="badges">
                  <span class="badge ${toneClassStatus(o.status)}">${o.status}</span>
                  <span class="badge ${toneClassJudge(o.judge)}">${o.judge}</span>
                </div>
              </div>`).join("")}</div>`}
        </div>
      </div>
      <div class="card">
        <div class="card-head">運用設定</div>
        <div class="card-body">
          ${settingsPanelHTML(true)}
        </div>
      </div>
    </div>`;
}

function stat(label,val,sub,cls,icon){
  return `<div class="card stat-card"><div><div class="stat-label">${label}</div><div class="stat-value">${val}</div><div class="stat-sub">${sub}</div></div><div class="stat-icon ${cls}">${icon}</div></div>`;
}

function settingsPanelHTML(readonly){
  return `
    <div><div class="setting-title">会社名</div><input value="${state.settings.companyName}" ${readonly?"readonly":""} id="${readonly?'':'settingsCompany'}"></div>
    <div class="setting-row"><div><div class="setting-title">通知文面の自動生成</div><div class="setting-sub">受注登録時に担当者向け文面を作成</div></div><input type="checkbox" class="switch" ${state.settings.autoMail?'checked':''} ${readonly?'disabled':''} id="${readonly?'':'settingsMail'}"></div>
    <div class="setting-row"><div><div class="setting-title">外注自動判定</div><div class="setting-sub">担当者の工数と納期からAI想定判定</div></div><input type="checkbox" class="switch" ${state.settings.autoOutsource?'checked':''} ${readonly?'disabled':''} id="${readonly?'':'settingsOut'}"></div>
    <div class="setting-row"><div><div class="setting-title">LINE通知文生成</div><div class="setting-sub">自動送信ではなく、送信用テキストを生成</div></div><input type="checkbox" class="switch" ${state.settings.lineReady?'checked':''} ${readonly?'disabled':''} id="${readonly?'':'settingsLine'}"></div>
    ${readonly ? '' : `<div class="top-actions"><button id="resetAllBtn" class="btn btn-light">データ初期化</button><button class="btn btn-light">自動保存中</button></div>`}
  `;
}

function renderOrders(){
  const q = ($("#orderSearch")?.value || "").toLowerCase();
  const status = $("#orderStatus")?.value || "all";
  const filtered = state.orders.filter(o=>{
    const matchQ = [o.id,o.client,o.assignee,o.projectName,o.templateTitle].join(" ").toLowerCase().includes(q);
    const matchS = status==="all" ? true : o.status===status;
    return matchQ && matchS;
  });
  $("#ordersPage").innerHTML = `
    <div class="page-header"><div><h1>受注管理</h1><div class="sub">テンプレートから新規受注を登録</div></div><div></div></div>
    <div class="search-row">
      <input id="orderSearch" class="search" placeholder="お客様名・受注番号で検索..." value="${($("#orderSearch")?.value)||""}">
      <select id="orderStatus">
        <option value="all" ${status==="all"?"selected":""}>すべて</option>
        <option value="納期OK" ${status==="納期OK"?"selected":""}>納期OK</option>
        <option value="納期NG" ${status==="納期NG"?"selected":""}>納期NG</option>
        <option value="納品受信" ${status==="納品受信"?"selected":""}>納品受信</option>
      </select>
    </div>
    <div class="card table-card">
      <div class="table-head"><div>受注番号</div><div>顧客</div><div>案件名</div><div>カテゴリ</div><div>担当者</div><div>予定</div><div>判定</div><div>ステータス</div><div>操作</div></div>
      ${filtered.length===0?`<div class="card-body" style="text-align:center;color:#9ca3af">データなし</div>`:filtered.map(o=>`
        <div class="table-row">
          <div>${o.id}</div><div>${o.client}</div><div>${o.projectName}</div><div>${o.category}</div><div>${o.assignee}</div><div>${o.estimate}</div>
          <div><span class="badge ${toneClassJudge(o.judge)}">${o.judge}</span></div>
          <div><span class="badge ${toneClassStatus(o.status)}">${o.status}</span></div>
          <div class="action-row">
            <button class="small-btn" data-notice="${o.id}">通知</button>
            ${o.outsourceNeeded?`<button class="small-btn" data-inst="${o.id}">指示書</button>`:""}
            <button class="small-btn" data-line="${o.id}">LINE文</button>
            <button class="small-btn" data-del="${o.id}">削除</button>
          </div>
        </div>`).join("")}
    </div>`;
  $("#orderSearch").oninput = renderOrders;
  $("#orderStatus").onchange = renderOrders;
  document.querySelectorAll("[data-notice]").forEach(b=> b.onclick = ()=> {
    const o = state.orders.find(x=>x.id===b.dataset.notice); downloadText(`${o.id}_担当者通知.txt`, o.mailText);
  });
  document.querySelectorAll("[data-inst]").forEach(b=> b.onclick = ()=> {
    const o = state.orders.find(x=>x.id===b.dataset.inst); downloadText(`${o.id}_外注指示書.txt`, o.outsourceInstruction || o.notice);
  });
  document.querySelectorAll("[data-line]").forEach(b=> b.onclick = ()=> {
    const o = state.orders.find(x=>x.id===b.dataset.line); navigator.clipboard.writeText(o.lineText || o.notice); alert("LINE通知文をコピーしました");
  });
  document.querySelectorAll("[data-del]").forEach(b=> b.onclick = ()=> {
    state.orders = state.orders.filter(x=>x.id!==b.dataset.del); saveState(); renderPage();
  });
}

function renderTemplates(){
  $("#templatesPage").innerHTML = `
    <div class="page-header"><div><h1>テンプレート</h1><div class="sub">発注テンプレートの管理</div></div><button class="btn btn-primary">新規テンプレート</button></div>
    <div class="cards">
      ${templates.map(t=>`
        <div class="card template-card">
          <div class="template-top"><div><div class="tpl-title">${t.title}</div><div class="badge inner" style="margin-top:8px">${t.category}</div></div><div class="template-icon">${t.icon}</div></div>
          <div class="tpl-sub">標準テンプレートです。</div>
          <div class="tpl-stats"><span>${t.hours}時間</span><span>${yen(t.price)}</span><span>≒ ${t.tasks.length} タスク</span></div>
          <div class="task-list">${t.tasks.map(([task,h])=>`<div class="task-item"><span>${task}</span><span>${h}</span></div>`).join("")}</div>
        </div>`).join("")}
    </div>`;
}

function renderStaff(){
  $("#staffPage").innerHTML = `
    <div class="page-header"><div><h1>スタッフ</h1><div class="sub">担当者の管理と稼働状況</div></div><button id="addStaffBtn" class="btn btn-primary">新規スタッフ</button></div>
    <div class="cards">
      ${state.staff.map(s=>{
        const busy = busyHoursByStaff(s.id);
        const progress = Math.min(Math.round((busy/40)*100),100);
        return `<div class="card staff-card">
          <div class="staff-top">
            <div>
              <div class="staff-name">${s.name}</div>
              <div class="staff-role">${s.role}</div>
            </div>
            <span class="badge ok">${s.status}</span>
          </div>
          <div class="staff-info"><div>${s.email}</div><div>${s.hoursPerDay}時間/日</div></div>
          <div class="mini-label">稼働状況（AI算出）</div>
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px"><span class="muted"></span><span>${busy}時間</span></div>
          <div class="progress-line"><div class="progress-fill" style="width:${progress}%"></div></div>
          <div class="skill-wrap" style="margin-top:14px">${s.skills.map(sk=>`<span class="skill">${sk}</span>`).join("")}</div>
          <div class="staff-actions">
            <button class="icon-round" data-editstaff="${s.id}">✎</button>
            <button class="icon-round" data-delstaff="${s.id}">🗑</button>
          </div>
        </div>`;
      }).join("")}
    </div>`;
  $("#addStaffBtn").onclick = ()=> openStaffModal();
  document.querySelectorAll("[data-editstaff]").forEach(b=>b.onclick = ()=> {
    const found = state.staff.find(x=>x.id===b.dataset.editstaff); openStaffModal(found);
  });
  document.querySelectorAll("[data-delstaff]").forEach(b=>b.onclick = ()=> {
    state.staff = state.staff.filter(x=>x.id!==b.dataset.delstaff); saveState(); renderPage();
  });
}

function renderReports(){
  $("#reportsPage").innerHTML = `
    <div class="page-header"><div><h1>日程</h1><div class="sub">業務内容から自動生成された作業日程一覧</div></div></div>
    <div class="card"><div class="card-body">
    ${state.orders.length===0?`<div class="empty-box" style="height:220px">日程はまだありません</div>`:state.orders.map(o=>`
      <div class="card report-card" style="margin-bottom:14px">
        <div class="template-top">
          <div><div class="tpl-title">${o.client} / ${o.projectName}</div><div class="tpl-sub">開始: ${o.startDate} ・ 完了見込み: ${o.finishDate}</div></div>
          <div class="badges"><span class="badge ${toneClassStatus(o.status)}">${o.status}</span><span class="badge ${toneClassJudge(o.judge)}">${o.judge}</span></div>
        </div>
        <div class="report-steps" style="margin-top:14px">${o.reportItems.map(it=>`<div class="step-item"><span>${it.step}. ${it.task}</span><span>${it.hours}</span></div>`).join("")}</div>
      </div>`).join("")}
    </div></div>`;
}

function renderOutsource(){
  const outs = state.orders.filter(o=>o.outsourceNeeded);
  $("#outsourcePage").innerHTML = `
    <div class="page-header"><div><h1>外注管理</h1><div class="sub">外注指示書管理・送信・戻り案件受信</div></div><button id="openReceiveBtn" class="btn btn-primary">外注完了案件を受信</button></div>
    <div class="card"><div class="card-body">
      ${outs.length===0?`<div class="empty-box" style="height:220px">外注依頼はまだありません</div>`:
        outs.map(o=>`<div class="card out-card" style="margin-bottom:14px">
          <div class="out-top"><div><div class="tpl-title">${o.client} / ${o.projectName}</div><div class="tpl-sub">納期: ${o.deadline} ・ 予算: ${o.amount}</div></div><div class="top-actions"><button class="btn btn-light" data-outinst="${o.id}">指示書DL</button><button class="btn btn-light" data-receiveone="${o.id}">受信済みにする</button></div></div>
          <div class="receive-note" style="margin-top:14px">${o.notice}</div>
        </div>`).join("")}
    </div></div>`;
  $("#openReceiveBtn").onclick = ()=> $("#receiveModal").classList.remove("hidden");
  document.querySelectorAll("[data-outinst]").forEach(b=>b.onclick = ()=> {
    const o = state.orders.find(x=>x.id===b.dataset.outinst); downloadText(`${o.id}_外注指示書.txt`, o.outsourceInstruction || o.notice);
  });
  document.querySelectorAll("[data-receiveone]").forEach(b=>b.onclick = ()=> receiveCompleted(b.dataset.receiveone, "外注先より納品完了"));
}

function settingsBind(){
  const company = $("#settingsCompany"), mail=$("#settingsMail"), out=$("#settingsOut"), line=$("#settingsLine"), reset=$("#resetAllBtn");
  if(company) company.oninput = ()=> { state.settings.companyName = company.value; saveState(); };
  if(mail) mail.onchange = ()=> { state.settings.autoMail = mail.checked; saveState(); };
  if(out) out.onchange = ()=> { state.settings.autoOutsource = out.checked; saveState(); };
  if(line) line.onchange = ()=> { state.settings.lineReady = line.checked; saveState(); };
  if(reset) reset.onclick = ()=> {
    state.orders = [];
    state.staff = JSON.parse(JSON.stringify(initialStaff));
    state.samplePool = createSamplePool();
    localStorage.removeItem(STORAGE_KEY);
    saveState();
    renderPage();
  };
}

function renderPage(){
  renderDashboard();
  renderOrders();
  renderTemplates();
  renderStaff();
  renderReports();
  renderOutsource();
  settingsBind();
}

function openOrderModal(){
  $("#orderModal").classList.remove("hidden");
  resetOrderForm();
}
function closeOrderModal(){ $("#orderModal").classList.add("hidden"); }

function resetOrderForm(){
  $("#fClient").value=""; $("#fClientEmail").value=""; $("#fProjectName").value="";
  $("#fPriority").value="通常"; $("#fAmount").value=""; $("#fDeliverable").value="AI / PSD / PNG";
  $("#fRevisionCount").value="2"; $("#fDetails").value=""; $("#fDeadline").value=""; $("#fMemo").value="";
  $("#pickedFileName").textContent="ファイルを選択（PDF推奨）";
  $("#pdfMsg").classList.add("hidden"); $("#pdfMsg").textContent="";
  document.querySelectorAll(".tab").forEach((t,i)=>t.classList.toggle("active", i===0));
  $("#manualTab").classList.remove("hidden");
  $("#pdfTab").classList.add("hidden");
  fillTemplateSelect();
  updatePreview();
}

function fillTemplateSelect(){
  const select = $("#fTemplate");
  select.innerHTML = `<option value="">テンプレートを選択</option>` + templates.map(t=>`<option value="${t.id}">${t.title}</option>`).join("");
}

function openStaffModal(data=null){
  state.staffEditing = data;
  $("#staffModalTitle").textContent = data ? "スタッフ編集" : "スタッフ追加";
  $("#sName").value = data?.name || "";
  $("#sRole").value = data?.role || "デザイナー";
  $("#sEmail").value = data?.email || "";
  $("#sHours").value = data?.hoursPerDay || 8;
  $("#sSkills").value = data?.skills?.join(", ") || "";
  $("#staffModal").classList.remove("hidden");
}
function closeStaffModal(){ $("#staffModal").classList.add("hidden"); }

function gatherForm(){
  return {
    client: $("#fClient").value.trim(),
    clientEmail: $("#fClientEmail").value.trim(),
    projectName: $("#fProjectName").value.trim(),
    priority: $("#fPriority").value,
    templateId: $("#fTemplate").value,
    amount: $("#fAmount").value,
    deliverable: $("#fDeliverable").value.trim(),
    revisionCount: $("#fRevisionCount").value,
    details: $("#fDetails").value.trim(),
    deadline: $("#fDeadline").value,
    memo: $("#fMemo").value.trim(),
    source: "新規受注",
  };
}

function updatePreview(){
  const form = gatherForm();
  const canSubmit = !!(form.client && form.projectName && form.templateId && form.deadline);
  $("#saveOrderBtn").disabled = !canSubmit;
  $("#submitHint").textContent = canSubmit ? "登録できます" : "* 顧客名 / 案件名 / テンプレ / 納期 を入れると登録できます";
  const canPreview = !!(form.client && form.projectName && form.templateId);
  if(!canPreview){
    $("#previewEmpty").classList.remove("hidden");
    $("#previewBox").classList.add("hidden");
    return;
  }
  const payload = buildOrderPayload(form);
  if(!payload) return;
  $("#previewEmpty").classList.add("hidden");
  $("#previewBox").classList.remove("hidden");
  $("#pAssignee").textContent = payload.assignee;
  $("#pEstimate").textContent = payload.estimate;
  $("#pJudge").textContent = payload.judge;
  $("#pFinish").textContent = payload.finishDate;
  $("#pNotice").textContent = payload.notice;
}

async function parsePdf(file){
  $("#pickedFileName").textContent = file.name;
  const msg = $("#pdfMsg");
  msg.classList.remove("hidden");
  msg.textContent = "PDFを解析中です...";
  try{
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({data:buf}).promise;
    let text = "";
    const maxPages = Math.min(pdf.numPages, 8);
    for(let i=1;i<=maxPages;i++){
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += " " + content.items.map(item => item.str || "").join(" ");
    }
    const normalized = text.replace(/\s+/g," ").trim();
    const baseName = file.name.replace(/\.pdf$/i,"").replace(/[_-]+/g," ");
    const hitTemplate = templates.find(t => normalized.includes(t.category) || normalized.includes(t.title)) || templates[0];
    const pickedClient = (/株式会社[^\s、。,]*/.exec(normalized)?.[0]) || $("#fClient").value || "未設定顧客";
    const pickedProject = (/案件名[:：]?\s*([^\n]+?)(?:納期|金額|仕様|$)/.exec(normalized)?.[1]?.trim()) || baseName || hitTemplate.title;
    const pickedAmount = (/([0-9]{2,3}(?:,[0-9]{3})+)円/.exec(normalized)?.[1]?.replace(/,/g,"")) || $("#fAmount").value;
    const pickedDeadline = ((/20[0-9]{2}[\/\-][0-9]{1,2}[\/\-][0-9]{1,2}/.exec(normalized)?.[0]) || "").replace(/\//g,"-");

    $("#fClient").value = pickedClient;
    $("#fClientEmail").value = $("#fClientEmail").value || "pending@example.jp";
    $("#fProjectName").value = pickedProject;
    $("#fTemplate").value = hitTemplate.id;
    $("#fAmount").value = pickedAmount;
    $("#fDetails").value = normalized.slice(0,700);
    if(pickedDeadline) $("#fDeadline").value = pickedDeadline;
    msg.textContent = "PDFを読み込みました。足りない項目だけ補って、そのまま登録できます。";
    document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
    document.querySelector('.tab[data-tab="manual"]').classList.add("active");
    $("#pdfTab").classList.add("hidden");
    $("#manualTab").classList.remove("hidden");
    updatePreview();
  }catch(e){
    console.error(e);
    msg.textContent = "PDFの読込に失敗しました。ファイル名は保持して手入力で続けられます。";
  }
}

function createOneSample(){
  if(state.samplePool.length===0) state.samplePool = createSamplePool();
  const next = state.samplePool.shift();
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + next.deadlineOffset);
  const payload = buildOrderPayload({...next, deadline: deadline.toISOString().slice(0,10)});
  if(payload){
    state.orders.unshift(payload);
    saveState();
    setPage("orders");
  }
}

function receiveCompleted(id, memo){
  state.orders = state.orders.map(o=> o.id===id ? {...o, outsourceNeeded:false, judge:"納品受信", status:"納品受信", memo:[o.memo,memo].filter(Boolean).join(" / ")} : o);
  saveState();
  renderPage();
}

function bindEvents(){
  $("#sampleOneBtn").onclick = createOneSample;
  $("#newOrderBtn").onclick = openOrderModal;
  $("#closeOrderModal").onclick = closeOrderModal;
  $("#cancelOrderBtn").onclick = closeOrderModal;
  $("#closeStaffModal").onclick = closeStaffModal;
  $("#cancelStaffBtn").onclick = closeStaffModal;
  $("#closeReceiveModal").onclick = ()=>$("#receiveModal").classList.add("hidden");
  $("#cancelReceiveBtn").onclick = ()=>$("#receiveModal").classList.add("hidden");

  document.querySelectorAll(".tab").forEach(tab=>{
    tab.onclick = ()=>{
      document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
      tab.classList.add("active");
      const pdf = tab.dataset.tab==="pdf";
      $("#pdfTab").classList.toggle("hidden", !pdf);
      $("#manualTab").classList.toggle("hidden", pdf);
    };
  });

  ["#fClient","#fClientEmail","#fProjectName","#fAmount","#fDeliverable","#fRevisionCount","#fDetails","#fDeadline","#fMemo"].forEach(sel=>{
    $(sel).addEventListener("input", updatePreview);
  });
  $("#fPriority").addEventListener("change", updatePreview);
  $("#fTemplate").addEventListener("change", ()=>{
    const tpl = templates.find(t=>t.id===$("#fTemplate").value);
    if(tpl){
      if(!$("#fProjectName").value) $("#fProjectName").value = tpl.title;
      if(!$("#fAmount").value) $("#fAmount").value = tpl.price;
      if(!$("#fDetails").value) $("#fDetails").value = `${tpl.title}に関する制作依頼。標準工程に沿って進行。`;
    }
    updatePreview();
  });

  $("#pdfInput").addEventListener("change", (e)=>{
    const file = e.target.files?.[0];
    if(file) parsePdf(file);
  });

  $("#saveOrderBtn").onclick = ()=>{
    const form = gatherForm();
    const payload = buildOrderPayload(form);
    if(!payload) return;
    state.orders.unshift(payload);
    saveState();
    closeOrderModal();
    setPage("orders");
  };

  $("#saveStaffBtn").onclick = ()=>{
    const payload = {
      id: state.staffEditing?.id || `st-${Date.now()}`,
      name: $("#sName").value.trim(),
      role: $("#sRole").value.trim(),
      email: $("#sEmail").value.trim(),
      hoursPerDay: Number($("#sHours").value) || 8,
      skills: $("#sSkills").value.split(",").map(s=>s.trim()).filter(Boolean),
      status: "稼働中",
    };
    if(!payload.name) return;
    if(state.staffEditing?.id){
      state.staff = state.staff.map(s=> s.id===payload.id ? payload : s);
    }else{
      state.staff.unshift(payload);
    }
    saveState();
    closeStaffModal();
    renderPage();
  };

  $("#saveReceiveBtn").onclick = ()=>{
    const id = $("#rId").value.trim();
    const memo = $("#rMemo").value.trim() || "外注先より納品完了";
    if(!id) return;
    receiveCompleted(id, memo);
    $("#rId").value = "";
    $("#rMemo").value = "";
    $("#receiveModal").classList.add("hidden");
  };
}

function init(){
  loadState();
  renderNav();
  $("#pageTitle").textContent = pageTitle();
  fillTemplateSelect();
  bindEvents();
  renderPage();
  setPage(state.currentPage);
}
init();
