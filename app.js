const STORAGE_KEY = "creative-manager-static-v2";
const yen = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });

const templatesSeed = [
  { id: "tpl-001", title: "ロゴデザイン基本", category: "ロゴデザイン", hours: 24, price: 150000, tasks: [["ヒアリング・構想", "4時間"], ["ラフスケッチ作成", "6時間"], ["デザイン制作", "8時間"], ["修正対応", "4時間"], ["データ納品", "2時間"]], icon: "✏️" },
  { id: "tpl-002", title: "ウェブサイトデザイン", category: "ウェブデザイン", hours: 60, price: 500000, tasks: [["ディレクション", "10時間"], ["ワイヤーフレーム", "12時間"], ["トップページ制作", "18時間"], ["下層ページ制作", "14時間"], ["レスポンシブ対応", "6時間"]], icon: "🌐" },
  { id: "tpl-003", title: "パッケージデザイン", category: "パッケージ", hours: 40, price: 300000, tasks: [["コンセプト設計", "8時間"], ["デザイン制作", "12時間"], ["展開パターン作成", "8時間"], ["入稿データ作成", "8時間"], ["最終確認", "4時間"]], icon: "📦" },
  { id: "tpl-004", title: "広告バナー制作", category: "広告デザイン", hours: 12, price: 80000, tasks: [["構成・コピー確認", "2時間"], ["デザイン制作", "6時間"], ["リサイズ対応", "3時間"], ["最終確認・納品", "1時間"]], icon: "🖼️" },
];

const staffSeed = [
  { id: "st-001", name: "上部 栞絵太", role: "ウェブエンジニア", email: "cweb@design.co.jp", hoursPerDay: 8, skills: ["ウェブデザイン", "インデックス", "CSS制作"], status: "稼働中" },
  { id: "st-002", name: "田中 太郎", role: "ディレクター", email: "tanaka@design.co.jp", hoursPerDay: 8, skills: ["ディレクション", "ブランディング", "クライアント対応"], status: "稼働中" },
  { id: "st-003", name: "佐藤 花子", role: "デザイナー", email: "sato@design.co.jp", hoursPerDay: 8, skills: ["ウェブデザイン", "UIデザイン", "ロゴデザイン"], status: "稼働中" },
  { id: "st-004", name: "鈴木 一郎", role: "イラストレーター", email: "suzuki@design.co.jp", hoursPerDay: 8, skills: ["イラスト", "パッケージデザイン", "キャラクターデザイン"], status: "稼働中" },
  { id: "st-005", name: "高橋 美咲", role: "ウェブエンジニア", email: "takahashi@design.co.jp", hoursPerDay: 8, skills: ["インデックス", "WordPress", "レスポンシブ"], status: "稼働中" },
];

const initialForm = {
  client: "",
  clientEmail: "",
  templateId: "",
  details: "",
  deadline: "",
  amount: "",
  briefFileName: "",
  projectName: "",
  priority: "通常",
  deliverable: "AI / PSD / PNG",
  revisionCount: "2",
  memo: "",
  source: "新規受注",
};

const navItems = [
  { key: "dashboard", label: "ダッシュボード", icon: "▦" },
  { key: "orders", label: "受注管理", icon: "☰" },
  { key: "templates", label: "テンプレート", icon: "◫" },
  { key: "staff", label: "スタッフ", icon: "◌" },
  { key: "reports", label: "日程", icon: "⌗" },
  { key: "outsource", label: "外注管理", icon: "▣" },
];

const state = {
  currentPage: "dashboard",
  templates: structuredClone(templatesSeed),
  staff: structuredClone(staffSeed),
  orders: [],
  samplePool: [],
  settings: { companyName: "チャッピー株式会社", autoMail: true, autoOutsource: true, lineReady: true },
  createOpen: false,
  createForm: { ...initialForm },
  createTab: "manual",
  pdfReadMessage: "",
  pdfReading: false,
  staffDialogOpen: false,
  staffDraft: null,
  outsourceDialogOpen: false,
  orderQuery: "",
  orderStatusFilter: "all",
  calendarAnchor: new Date(),
};

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    orders: state.orders,
    staff: state.staff,
    samplePool: state.samplePool,
    settings: state.settings,
  }));
}

function loadState() {
  state.samplePool = createSamplePool(state.templates);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.orders)) state.orders = parsed.orders;
    if (Array.isArray(parsed.staff)) state.staff = parsed.staff;
    if (Array.isArray(parsed.samplePool) && parsed.samplePool.length) state.samplePool = parsed.samplePool;
    if (parsed.settings) state.settings = { ...state.settings, ...parsed.settings };
  } catch (e) {
    console.error(e);
  }
}

function pageTitle(key) {
  return { dashboard: "ダッシュボード", orders: "受注管理", templates: "テンプレート", staff: "スタッフ", reports: "日程", outsource: "外注管理" }[key] || "ダッシュボード";
}

function parseAmount(value) {
  return Number(String(value).replace(/[^0-9]/g, "") || 0);
}

function calcWorkingDays(start, end) {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e < s) return 0;
  let count = 0;
  const current = new Date(s);
  while (current <= e) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count += 1;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

function addBusinessDays(dateStr, days) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return d.toLocaleDateString("ja-JP");
}

function statusClass(status) {
  if (status === "納期OK") return "badge ok";
  if (status === "納期NG") return "badge ng";
  if (status === "納品受信") return "badge";
  return "badge";
}

function judgeClass(judge) {
  if (judge === "社内対応") return "badge in";
  if (judge === "外注推奨") return "badge out";
  if (judge === "納品受信") return "badge";
  return "badge";
}

function statToneClass(key) {
  return {
    projects: "tone-violet",
    active: "tone-cyan",
    ng: "tone-rose",
    outsource: "tone-orange",
    staff: "tone-slate",
    amount: "tone-emerald",
  }[key] || "tone-slate";
}

function staffBusyHoursFromOrders(staffId) {
  const person = state.staff.find((s) => s.id === staffId);
  if (!person) return 0;
  return state.orders
    .filter((o) => o.assigneeId === staffId && o.judge !== "納品受信")
    .reduce((sum, order) => sum + Number(String(order.estimate).replace(/[^0-9]/g, "") || 0), 0);
}

function pickAssignee(template) {
  const skillMap = {
    ロゴデザイン: ["ロゴデザイン", "ブランディング"],
    ウェブデザイン: ["ウェブデザイン", "UIデザイン", "レスポンシブ"],
    パッケージ: ["パッケージデザイン", "イラスト"],
    広告デザイン: ["クライアント対応", "ウェブデザイン", "イラスト"],
  };
  const desired = skillMap[template?.category] || [];
  const sorted = [...state.staff].sort((a, b) => staffBusyHoursFromOrders(a.id) - staffBusyHoursFromOrders(b.id));
  return sorted.find((member) => desired.some((skill) => member.skills.includes(skill))) || sorted[0];
}

function buildOrderPayload(form) {
  const template = state.templates.find((t) => t.id === form.templateId);
  if (!template) return null;
  const assignee = pickAssignee(template);
  const today = new Date().toISOString().slice(0, 10);
  const daysUntilDeadline = calcWorkingDays(today, form.deadline || addBusinessDays(today, 5));
  const currentBusy = staffBusyHoursFromOrders(assignee.id);
  const internalCapacity = Math.max(daysUntilDeadline * assignee.hoursPerDay - currentBusy, 0);
  const priorityBoost = form.priority === "特急" ? 1.3 : form.priority === "高" ? 1.15 : 1;
  const adjustedHours = Math.ceil(template.hours * priorityBoost);
  const needOutsource = state.settings.autoOutsource && adjustedHours > internalCapacity;
  const status = needOutsource ? "納期NG" : "納期OK";
  const estimatedStart = today;
  const estimatedFinish = needOutsource ? (form.deadline || addBusinessDays(today, 7)) : addBusinessDays(today, Math.ceil(adjustedHours / assignee.hoursPerDay));
  const notice = needOutsource
    ? `【要対応】${form.client}様「${form.projectName || template.title}」は社内工数を超過する見込みです。外注候補の選定と指示書作成をお願いします。納期: ${form.deadline || "未設定"} / 想定工数: ${adjustedHours}時間`
    : `【対応可能】${form.client}様「${form.projectName || template.title}」は${assignee.name}が担当予定です。納期内に対応可能です。完了見込み: ${estimatedFinish}`;
  const lineText = needOutsource
    ? `外注対応が必要です\n案件: ${form.projectName || template.title}\n顧客: ${form.client}\n納期: ${form.deadline || "未設定"}\n担当: ${assignee.name}`
    : `新規受注\n案件: ${form.projectName || template.title}\n顧客: ${form.client}\n担当: ${assignee.name}\n完了見込み: ${estimatedFinish}`;
  const mailText = `${state.settings.companyName}\n${assignee.name}さん\n\n${notice}\n\n案件詳細:\n- 顧客: ${form.client}\n- 案件名: ${form.projectName || template.title}\n- 納品形式: ${form.deliverable}\n- 修正回数: ${form.revisionCount}回\n- 備考: ${form.memo || "なし"}\n`;
  const reportItems = template.tasks.map(([name, hours], i) => ({ step: i + 1, task: name, hours }));
  const outsourceInstruction = needOutsource ? `【外注指示書】\n会社名: ${state.settings.companyName}\n顧客名: ${form.client}\n案件名: ${form.projectName || template.title}\nカテゴリ: ${template.category}\n納期: ${form.deadline || "未設定"}\n希望納品形式: ${form.deliverable}\n修正回数: ${form.revisionCount}回\n案件詳細: ${form.details}\n備考: ${form.memo || "なし"}\n` : "";
  return {
    id: `OD-${Math.floor(1000 + Math.random() * 9000)}`,
    client: form.client,
    clientEmail: form.clientEmail,
    projectName: form.projectName,
    templateTitle: template.title,
    category: template.category,
    assignee: assignee.name,
    assigneeId: assignee.id,
    estimate: `${adjustedHours}時間`,
    amount: form.amount ? yen.format(Number(form.amount)) : yen.format(template.price),
    deadline: form.deadline || addBusinessDays(today, 7),
    status,
    judge: needOutsource ? "外注推奨" : "社内対応",
    details: form.details,
    notice,
    lineText,
    mailText,
    reportItems,
    startDate: estimatedStart,
    finishDate: estimatedFinish,
    outsourceNeeded: needOutsource,
    deliverable: form.deliverable,
    revisionCount: form.revisionCount,
    memo: form.memo,
    priority: form.priority,
    outsourceInstruction,
    createdAt: new Date().toLocaleString("ja-JP"),
    source: form.source || "新規受注",
  };
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function createSamplePool(templates) {
  const clients = ["チャッピー株式会社", "鳥取デザイン工房", "ソラミチ企画", "日本海フーズ", "株式会社ライト", "KKKスポーツ", "山陰テック", "砂丘観光PR", "Blue Note", "未来建設"];
  const projectWords = ["春キャンペーン", "採用LP", "新商品告知", "周年ロゴ", "Instagram広告", "会社案内", "展示会パネル", "パッケージ刷新", "ECバナー", "イベントチラシ"];
  const deliverables = ["AI / PNG", "Figma / PDF", "PSD / JPG", "AI / SVG / PNG", "XD / PDF"];
  const priorities = ["通常", "高", "特急"];
  const combos = [];
  let i = 0;
  while (combos.length < 30) {
    const template = templates[i % templates.length];
    const client = clients[Math.floor(i / templates.length) % clients.length];
    const projectName = `${projectWords[i % projectWords.length]} ${i + 1}`;
    combos.push({
      client,
      clientEmail: `sample${i + 1}@example.jp`,
      templateId: template.id,
      details: `${template.title}をベースにしたランダムサンプル案件です。`,
      deadlineOffset: 3 + (i % 18),
      amount: String(template.price + (i % 5) * 20000),
      projectName,
      priority: priorities[i % priorities.length],
      deliverable: randomFrom(deliverables),
      revisionCount: String((i % 3) + 1),
      memo: "サンプル自動生成",
      source: "サンプル案件",
    });
    i += 1;
  }
  return combos;
}

function monthMatrix(anchorDate) {
  const start = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
  const end = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0);
  const firstDay = start.getDay();
  const total = end.getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i += 1) cells.push(null);
  for (let day = 1; day <= total; day += 1) cells.push(new Date(anchorDate.getFullYear(), anchorDate.getMonth(), day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function setPage(page) {
  state.currentPage = page;
  render();
}

function openCreateDialog() {
  state.createOpen = true;
  state.createForm = { ...initialForm };
  state.createTab = "manual";
  state.pdfReadMessage = "";
  state.pdfReading = false;
  render();
}

function closeCreateDialog() {
  state.createOpen = false;
  render();
}

function createSample() {
  const next = state.samplePool[0];
  if (!next) {
    state.samplePool = createSamplePool(state.templates);
    saveState();
    render();
    return;
  }
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + next.deadlineOffset);
  const payload = buildOrderPayload({ ...next, deadline: deadline.toISOString().slice(0, 10) });
  if (payload) {
    state.orders.unshift(payload);
    state.samplePool = state.samplePool.slice(1);
    state.currentPage = "orders";
    saveState();
    render();
  }
}

function resetAll() {
  if (!window.confirm("データを初期化しますか？")) return;
  state.orders = [];
  state.staff = structuredClone(staffSeed);
  state.samplePool = createSamplePool(state.templates);
  localStorage.removeItem(STORAGE_KEY);
  render();
}

function downloadText(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function copyText(content) {
  navigator.clipboard.writeText(content).catch(() => {});
}

function receiveCompleted(id, memo) {
  state.orders = state.orders.map((o) => o.id === id ? { ...o, outsourceNeeded: false, judge: "納品受信", status: "納品受信", memo: [o.memo, memo].filter(Boolean).join(" / ") } : o);
  saveState();
  render();
}

function filteredOrders() {
  return state.orders.filter((o) => {
    const query = state.orderQuery.trim().toLowerCase();
    const matchesQuery = !query || [o.id, o.client, o.assignee, o.projectName, o.templateTitle].join(" ").toLowerCase().includes(query);
    const matchesStatus = state.orderStatusFilter === "all" ? true : o.status === state.orderStatusFilter;
    return matchesQuery && matchesStatus;
  });
}

function renderSidebar() {
  return `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-badge">✦</div>
        <div>
          <div class="brand-title">デザインマネージャー</div>
          <div class="brand-sub">クリエイティブ管理</div>
        </div>
      </div>
      <div class="nav">
        ${navItems.map((item) => `
          <button class="nav-btn ${state.currentPage === item.key ? "active" : ""}" data-nav="${item.key}">
            <span class="nav-left"><span class="nav-icon">${item.icon}</span><span>${item.label}</span></span>
            <span>›</span>
          </button>
        `).join("")}
      </div>
      <div class="sidebar-foot">
        <div class="version-box">デザインマネージャー 公開版 v1.1</div>
      </div>
    </aside>
  `;
}

function renderTopbar() {
  return `
    <div class="topbar">
      <div class="topbar-title">${pageTitle(state.currentPage)}</div>
      <div class="topbar-actions">
        <button class="btn" id="sampleBtn">サンプル1件追加</button>
        <button class="btn primary" id="openCreateBtn">新規受注</button>
      </div>
    </div>
  `;
}

function renderDashboard() {
  const active = state.orders.filter((o) => o.status !== "納期NG").length;
  const ng = state.orders.filter((o) => o.status === "納期NG").length;
  const outsource = state.orders.filter((o) => o.outsourceNeeded).length;
  const totalAmount = state.orders.reduce((sum, order) => sum + parseAmount(order.amount), 0);
  const recent = state.orders.slice(0, 4);
  return `
    <div class="page">
      <div class="page-head">
        <div>
          <h1>ダッシュボード</h1>
          <p>案件の概要と進捗状況</p>
        </div>
        <div class="card pad">
          <div style="font-weight:700;color:#6d28d9">${state.settings.companyName}</div>
          <div style="font-size:12px;color:#7c3aed;margin-top:6px">LINE文面生成: ${state.settings.lineReady ? "ON" : "OFF"}</div>
        </div>
      </div>
      <div class="grid stats-6">
        ${renderStat("すべてのプロジェクト", state.orders.length, "登録済み", "▣", "projects")}
        ${renderStat("進行中", active, "アクティブ", "◔", "active")}
        ${renderStat("納期NG", ng, "要対応", "!", "ng")}
        ${renderStat("外注候補", outsource, "AI判定", "↗", "outsource")}
        ${renderStat("スタッフ", state.staff.length, "稼働中", "○", "staff")}
        ${renderStat("受注総額", yen.format(totalAmount), "累計", "¥", "amount")}
      </div>
      <div class="grid grid-3-2" style="margin-top:20px">
        <div class="card pad">
          <div style="font-weight:700;margin-bottom:14px">最近の受注</div>
          ${recent.length === 0 ? `<div class="recent-empty">受注データなし</div>` : `<div class="recent-list">${recent.map((order) => `
            <div class="recent-item">
              <div>
                <div class="recent-title">${escapeHtml(order.client)} / ${escapeHtml(order.projectName)}</div>
                <div class="recent-sub">担当: ${escapeHtml(order.assignee)} ・ 納期: ${escapeHtml(order.deadline)}</div>
              </div>
              <div class="badges">
                <span class="${statusClass(order.status)}">${escapeHtml(order.status)}</span>
                <span class="${judgeClass(order.judge)}">${escapeHtml(order.judge)}</span>
              </div>
            </div>
          `).join("")}</div>`}
        </div>
        ${renderSettingsPanel(true)}
      </div>
    </div>
  `;
}

function renderStat(title, value, sub, icon, toneKey) {
  return `
    <div class="card stat">
      <div>
        <div class="label">${title}</div>
        <div class="value">${value}</div>
        <div class="sub">${sub}</div>
      </div>
      <div class="stat-badge ${statToneClass(toneKey)}">${icon}</div>
    </div>
  `;
}

function renderSettingsPanel(readonly = false) {
  return `
    <div class="card pad">
      <div style="font-weight:700;margin-bottom:16px">運用設定</div>
      <div class="settings-stack">
        <div class="field">
          <label>会社名</label>
          <input class="input" ${readonly ? "disabled" : ""} id="companyNameInput" value="${escapeAttr(state.settings.companyName)}" />
        </div>
        ${renderSwitchRow("通知文面の自動生成", "受注登録時に担当者向け文面を作成", "autoMail", readonly)}
        ${renderSwitchRow("外注自動判定", "担当者の工数と納期からAI想定判定", "autoOutsource", readonly)}
        ${renderSwitchRow("LINE通知文生成", "自動送信ではなく、送信用テキストを生成します", "lineReady", readonly)}
        ${readonly ? "" : `<div style="display:flex;gap:12px"><button class="btn" id="resetBtn">データ初期化</button></div>`}
      </div>
    </div>
  `;
}

function renderSwitchRow(title, sub, key, readonly) {
  return `
    <label class="switch-row">
      <div>
        <div class="switch-title">${title}</div>
        <div class="switch-sub">${sub}</div>
      </div>
      <input type="checkbox" data-setting-toggle="${key}" ${state.settings[key] ? "checked" : ""} ${readonly ? "disabled" : ""} />
    </label>
  `;
}

function renderOrders() {
  const rows = filteredOrders();
  const filteredAmount = rows.reduce((sum, order) => sum + parseAmount(order.amount), 0);
  return `
    <div class="page">
      <div class="page-head">
        <div>
          <h1>受注管理</h1>
          <p>テンプレートから新規受注を登録</p>
        </div>
        <button class="btn primary" id="openCreateBtn2">新規受注</button>
      </div>
      <div class="grid stats-3" style="margin-bottom:20px">
        ${renderStat("表示中案件の合計金額", yen.format(filteredAmount), "合計", "¥", "amount")}
        ${renderStat("表示件数", rows.length, "フィルタ後", "#", "staff")}
        ${renderStat("外注候補件数", rows.filter((o) => o.outsourceNeeded).length, "候補", "↗", "outsource")}
      </div>
      <div class="toolbar">
        <div class="search-wrap"><input class="input" id="orderQueryInput" placeholder="お客様名・受注番号で検索..." value="${escapeAttr(state.orderQuery)}" /></div>
        <select class="select" id="statusFilterSelect" style="width:180px">
          ${renderOptions(["all", "納期OK", "納期NG", "納品受信"], state.orderStatusFilter, { all: "すべて" })}
        </select>
      </div>
      <div class="card content-table">
        <table class="table">
          <thead><tr><th>受注番号</th><th>顧客</th><th>案件名</th><th>カテゴリ</th><th>担当者</th><th>予定</th><th>判定</th><th>ステータス</th><th>操作</th></tr></thead>
          <tbody>
            ${rows.length === 0 ? `<tr><td colspan="9" style="text-align:center;color:#94a3b8;padding:32px">データなし</td></tr>` : rows.map((order) => `
              <tr>
                <td><strong>${escapeHtml(order.id)}</strong></td>
                <td>${escapeHtml(order.client)}</td>
                <td>${escapeHtml(order.projectName)}</td>
                <td>${escapeHtml(order.category)}</td>
                <td>${escapeHtml(order.assignee)}</td>
                <td>${escapeHtml(order.estimate)}</td>
                <td><span class="${judgeClass(order.judge)}">${escapeHtml(order.judge)}</span></td>
                <td><span class="${statusClass(order.status)}">${escapeHtml(order.status)}</span></td>
                <td>
                  <div class="action-row">
                    <button class="btn small" data-notice="${order.id}">通知</button>
                    ${order.outsourceNeeded ? `<button class="btn small" data-instruction="${order.id}">指示書</button>` : ""}
                    <button class="btn small" data-line="${order.id}">LINE文</button>
                    <button class="btn small" data-delete-order="${order.id}">削除</button>
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderTemplates() {
  return `
    <div class="page">
      <div class="page-head">
        <div><h1>テンプレート</h1><p>発注テンプレートの管理</p></div>
        <button class="btn primary">新規テンプレート</button>
      </div>
      <div class="templates">
        ${state.templates.map((tpl) => `
          <div class="card template-card">
            <div class="template-head">
              <div>
                <div style="font-weight:800">${escapeHtml(tpl.title)}</div>
                <div class="badge" style="margin-top:8px">${escapeHtml(tpl.category)}</div>
              </div>
              <div class="template-icon">${tpl.icon}</div>
            </div>
            <div style="color:#64748b;font-size:14px">${escapeHtml(tpl.category)}案件の標準テンプレートです。</div>
            <div class="meta-row"><span>${tpl.hours}時間</span><span>${yen.format(tpl.price)}</span><span>≒ ${tpl.tasks.length} タスク</span></div>
            <div class="task-list">${tpl.tasks.map(([task, hour]) => `<div class="task-row"><span>${escapeHtml(task)}</span><span>${escapeHtml(hour)}</span></div>`).join("")}</div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderStaff() {
  return `
    <div class="page">
      <div class="page-head">
        <div><h1>スタッフ</h1><p>担当者の管理と稼働状況</p></div>
        <button class="btn primary" id="openStaffCreate">新規スタッフ</button>
      </div>
      <div class="staff-grid">
        ${state.staff.map((person) => {
          const busyHours = staffBusyHoursFromOrders(person.id);
          const progress = Math.min(Math.round((busyHours / 40) * 100), 100);
          return `
            <div class="card staff-card">
              <div class="staff-head">
                <div style="display:flex;gap:12px;align-items:center">
                  <div class="avatar">${escapeHtml(person.name.slice(0, 1))}</div>
                  <div><div style="font-weight:800">${escapeHtml(person.name)}</div><div style="font-size:12px;color:#64748b;margin-top:4px">${escapeHtml(person.role)}</div></div>
                </div>
                <span class="badge ok">${escapeHtml(person.status)}</span>
              </div>
              <div style="display:flex;flex-direction:column;gap:8px;font-size:14px;color:#64748b">
                <div>✉ ${escapeHtml(person.email)}</div>
                <div>🕒 ${person.hoursPerDay}時間/日</div>
              </div>
              <div class="progress-wrap">
                <div class="progress-label"><span>稼働状況（AI算出）</span><strong>${busyHours}時間</strong></div>
                <div class="progress"><span style="width:${progress}%"></span></div>
              </div>
              <div class="skills">${person.skills.map((skill) => `<span class="skill">${escapeHtml(skill)}</span>`).join("")}</div>
              <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px">
                <button class="icon-btn" data-edit-staff="${person.id}">✎</button>
                <button class="icon-btn danger" data-delete-staff="${person.id}">🗑</button>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function renderReports() {
  const cells = monthMatrix(state.calendarAnchor);
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const monthOrders = new Map();
  state.orders.forEach((order) => {
    const finish = new Date(order.finishDate);
    if (!Number.isNaN(finish.getTime()) && finish.getFullYear() === state.calendarAnchor.getFullYear() && finish.getMonth() === state.calendarAnchor.getMonth()) {
      const key = finish.toDateString();
      if (!monthOrders.has(key)) monthOrders.set(key, []);
      monthOrders.get(key).push(order);
    }
  });
  return `
    <div class="page">
      <div class="page-head">
        <div><h1>日程</h1><p>業務内容から自動生成された作業日程一覧</p></div>
      </div>
      <div class="card calendar">
        <div class="calendar-head">
          <div style="font-weight:700">カレンダー表示</div>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="btn small" id="prevMonthBtn">前月</button>
            <div style="min-width:140px;text-align:center;font-weight:700">${state.calendarAnchor.getFullYear()}年 ${state.calendarAnchor.getMonth() + 1}月</div>
            <button class="btn small" id="nextMonthBtn">次月</button>
          </div>
        </div>
        <div class="calendar-grid">${weekdays.map((d) => `<div class="calendar-dayname">${d}</div>`).join("")}</div>
        <div class="calendar-grid" style="margin-top:8px">
          ${cells.map((cell) => {
            if (!cell) return `<div class="calendar-cell calendar-empty"></div>`;
            const items = monthOrders.get(cell.toDateString()) || [];
            return `<div class="calendar-cell"><div class="calendar-date">${cell.getDate()}</div><div class="calendar-events">${items.slice(0, 3).map((item) => `<div class="calendar-event">${escapeHtml(item.projectName)}</div>`).join("")}${items.length > 3 ? `<div style="font-size:11px;color:#64748b">+${items.length - 3}件</div>` : ""}</div></div>`;
          }).join("")}
        </div>
      </div>
      <div class="card pad" style="margin-top:20px">
        ${state.orders.length === 0 ? `<div class="empty-box">日程はまだありません</div>` : `<div class="schedule-list">${state.orders.map((order) => `
          <div class="card schedule-card">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:16px">
              <div><div style="font-weight:800">${escapeHtml(order.client)} / ${escapeHtml(order.projectName)}</div><div style="font-size:14px;color:#64748b;margin-top:6px">開始: ${escapeHtml(order.startDate)} ・ 完了見込み: ${escapeHtml(order.finishDate)}</div></div>
              <div class="badges"><span class="${statusClass(order.status)}">${escapeHtml(order.status)}</span><span class="${judgeClass(order.judge)}">${escapeHtml(order.judge)}</span></div>
            </div>
            <div class="schedule-items">${order.reportItems.map((item) => `<div class="schedule-item"><span>${item.step}. ${escapeHtml(item.task)}</span><span>${escapeHtml(item.hours)}</span></div>`).join("")}</div>
          </div>
        `).join("")}</div>`}
      </div>
    </div>
  `;
}

function renderOutsource() {
  const outsourceOrders = state.orders.filter((o) => o.outsourceNeeded);
  const total = outsourceOrders.reduce((sum, order) => sum + parseAmount(order.amount), 0);
  return `
    <div class="page">
      <div class="page-head">
        <div><h1>外注管理</h1><p>外注指示書管理・送信・戻り案件受信</p></div>
        <button class="btn primary" id="openOutsourceReceive">外注完了案件を受信</button>
      </div>
      <div class="grid stats-3" style="margin-bottom:20px">
        ${renderStat("外注候補金額", yen.format(total), "合計", "¥", "amount")}
        ${renderStat("外注候補件数", outsourceOrders.length, "候補", "↗", "outsource")}
        ${renderStat("納品受信済み", state.orders.filter((o) => o.status === "納品受信").length, "累計", "✓", "staff")}
      </div>
      <div class="card pad">
        ${outsourceOrders.length === 0 ? `<div class="empty-box">外注依頼はまだありません</div>` : `<div class="outsource-list">${outsourceOrders.map((order) => `
          <div class="card outsource-card">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap">
              <div><div style="font-weight:800">${escapeHtml(order.client)} / ${escapeHtml(order.projectName)}</div><div style="font-size:14px;color:#64748b;margin-top:6px">納期: ${escapeHtml(order.deadline)} ・ 予算: ${escapeHtml(order.amount)}</div></div>
              <div class="action-row">
                <button class="btn small" data-instruction="${order.id}">指示書DL</button>
                <button class="btn small" data-receive-now="${order.id}">受信済みにする</button>
              </div>
            </div>
            <div class="notice-box" style="margin-top:14px">${escapeHtml(order.notice).replace(/\n/g, "<br>")}</div>
          </div>
        `).join("")}</div>`}
      </div>
    </div>
  `;
}

function renderDialog() {
  if (!state.createOpen) return "";
  const tplOptions = `<option value="">テンプレートを選択</option>` + state.templates.map((tpl) => `<option value="${tpl.id}" ${state.createForm.templateId === tpl.id ? "selected" : ""}>${escapeHtml(tpl.title)}</option>`).join("");
  const preview = state.createForm.templateId && state.createForm.projectName && state.createForm.client ? buildOrderPayload(state.createForm) : null;
  return `
    <div class="dialog-backdrop" id="dialogBackdrop">
      <div class="dialog">
        <div class="dialog-head">
          <div class="dialog-title">新規受注登録</div>
          <button class="icon-btn" id="closeCreateDialog">×</button>
        </div>
        <div class="dialog-body">
          <div class="dialog-left">
            <div class="tabs">
              <button class="tab ${state.createTab === "manual" ? "active" : ""}" data-create-tab="manual">手入力</button>
              <button class="tab ${state.createTab === "auto" ? "active" : ""}" data-create-tab="auto">PDF / 発注書読込</button>
            </div>
            ${state.createTab === "auto" ? `
              <div class="notice-box">
                <div style="font-weight:700;margin-bottom:10px">発注書・仕様書を添付してAI自動入力</div>
                <div class="field">
                  <label>ファイル</label>
                  <input class="input" type="file" id="pdfInput" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" />
                </div>
                <div style="margin-top:12px;color:#6d28d9">${state.pdfReading ? "PDFを解析中です..." : escapeHtml(state.pdfReadMessage || "PDFから、顧客名・案件名・テンプレ候補・詳細文・日付候補を自動反映します。")}</div>
              </div>
            ` : `
              <div class="grid-2">
                <div class="field"><label>顧客名 *</label><input class="input" data-form="client" value="${escapeAttr(state.createForm.client)}" /></div>
                <div class="field"><label>顧客メール</label><input class="input" data-form="clientEmail" value="${escapeAttr(state.createForm.clientEmail)}" /></div>
                <div class="field"><label>案件名 *</label><input class="input" data-form="projectName" value="${escapeAttr(state.createForm.projectName)}" /></div>
                <div class="field"><label>優先度</label><select class="select" data-form="priority">${renderOptions(["通常", "高", "特急"], state.createForm.priority)}</select></div>
                <div class="field"><label>テンプレート *</label><select class="select" data-form="templateId">${tplOptions}</select></div>
                <div class="field"><label>受注金額</label><input class="input" data-form="amount" value="${escapeAttr(state.createForm.amount)}" /></div>
                <div class="field"><label>納品形式</label><input class="input" data-form="deliverable" value="${escapeAttr(state.createForm.deliverable)}" /></div>
                <div class="field"><label>修正回数</label><input class="input" data-form="revisionCount" value="${escapeAttr(state.createForm.revisionCount)}" /></div>
                <div class="field" style="grid-column:1/-1"><label>発注詳細</label><textarea class="textarea" data-form="details">${escapeHtml(state.createForm.details)}</textarea></div>
                <div class="field"><label>納期 *</label><input class="input" type="date" data-form="deadline" value="${escapeAttr(state.createForm.deadline)}" /></div>
                <div class="field"><label>社内メモ</label><input class="input" data-form="memo" value="${escapeAttr(state.createForm.memo)}" /></div>
              </div>
            `}
          </div>
          <div class="dialog-right">
            <div style="font-weight:700;margin-bottom:14px">AI判定プレビュー</div>
            <div class="preview-box">
              ${!preview ? `<div style="color:#94a3b8">顧客名・案件名・テンプレが入るとプレビュー開始。納期を入れると確定精度が上がります。</div>` : `
                <div class="preview-grid">
                  ${infoMini("担当者", preview.assignee)}
                  ${infoMini("想定工数", preview.estimate)}
                  ${infoMini("判定", preview.judge)}
                  ${infoMini("完了見込み", preview.finishDate)}
                </div>
                <div class="field"><label>通知文面</label><div class="notice-box">${escapeHtml(preview.notice).replace(/\n/g, "<br>")}</div></div>
              `}
            </div>
          </div>
        </div>
        <div class="dialog-foot">
          <div class="helper">${preview ? "登録できます" : "顧客名 / 案件名 / テンプレ / 納期 を入れると登録できます"}</div>
          <div style="display:flex;gap:12px">
            <button class="btn" id="cancelCreateDialog">キャンセル</button>
            <button class="btn primary" id="submitCreateDialog" ${preview ? "" : "disabled"}>受注登録</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function infoMini(label, value) {
  return `<div style="border:1px solid var(--line);border-radius:14px;padding:12px;background:#fff"><div style="font-size:12px;color:#64748b">${label}</div><div style="font-weight:700;margin-top:6px">${escapeHtml(value)}</div></div>`;
}

function renderStaffDialog() {
  if (!state.staffDialogOpen || !state.staffDraft) return "";
  const draft = state.staffDraft;
  return `
    <div class="dialog-backdrop" id="staffDialogBackdrop">
      <div class="dialog small">
        <div class="dialog-head"><div class="dialog-title">${draft.id ? "スタッフ編集" : "スタッフ追加"}</div><button class="icon-btn" id="closeStaffDialog">×</button></div>
        <div class="dialog-left">
          <div class="field"><label>氏名</label><input class="input" data-staff="name" value="${escapeAttr(draft.name || "")}" /></div>
          <div class="field"><label>役職</label><input class="input" data-staff="role" value="${escapeAttr(draft.role || "")}" /></div>
          <div class="field"><label>メール</label><input class="input" data-staff="email" value="${escapeAttr(draft.email || "")}" /></div>
          <div class="field"><label>1日稼働時間</label><input class="input" type="number" data-staff="hoursPerDay" value="${escapeAttr(String(draft.hoursPerDay || 8))}" /></div>
          <div class="field"><label>スキル（カンマ区切り）</label><input class="input" data-staff="skills" value="${escapeAttr((draft.skills || []).join(", "))}" /></div>
        </div>
        <div class="dialog-foot"><div></div><div style="display:flex;gap:12px"><button class="btn" id="cancelStaffDialog">キャンセル</button><button class="btn primary" id="saveStaffDialog">保存</button></div></div>
      </div>
    </div>
  `;
}

function renderOutsourceDialog() {
  if (!state.outsourceDialogOpen) return "";
  return `
    <div class="dialog-backdrop" id="outsourceDialogBackdrop">
      <div class="dialog small">
        <div class="dialog-head"><div class="dialog-title">外注完了案件を受信</div><button class="icon-btn" id="closeOutsourceDialog">×</button></div>
        <div class="dialog-left">
          <div class="field"><label>受注番号（例: OD-1234）</label><input class="input" id="outsourceReceiveId" /></div>
          <div class="field"><label>受信メモ</label><textarea class="textarea" id="outsourceReceiveMemo"></textarea></div>
        </div>
        <div class="dialog-foot"><div></div><div style="display:flex;gap:12px"><button class="btn" id="cancelOutsourceDialog">キャンセル</button><button class="btn primary" id="submitOutsourceDialog">受信登録</button></div></div>
      </div>
    </div>
  `;
}

function renderOptions(values, selected, labels = {}) {
  return values.map((v) => `<option value="${escapeAttr(v)}" ${selected === v ? "selected" : ""}>${labels[v] || v}</option>`).join("");
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function escapeAttr(str) {
  return escapeHtml(str);
}

function renderContent() {
  if (state.currentPage === "dashboard") return renderDashboard();
  if (state.currentPage === "orders") return renderOrders();
  if (state.currentPage === "templates") return renderTemplates();
  if (state.currentPage === "staff") return renderStaff();
  if (state.currentPage === "reports") return renderReports();
  return renderOutsource();
}

function render() {
  document.getElementById("app").innerHTML = `
    <div class="app-shell">
      ${renderSidebar()}
      <div class="main">
        ${renderTopbar()}
        ${renderContent()}
      </div>
    </div>
    ${renderDialog()}
    ${renderStaffDialog()}
    ${renderOutsourceDialog()}
  `;
  bindEvents();
}

function bindEvents() {
  document.querySelectorAll("[data-nav]").forEach((btn) => btn.onclick = () => setPage(btn.dataset.nav));
  document.getElementById("sampleBtn")?.addEventListener("click", createSample);
  document.getElementById("openCreateBtn")?.addEventListener("click", openCreateDialog);
  document.getElementById("openCreateBtn2")?.addEventListener("click", openCreateDialog);
  document.getElementById("resetBtn")?.addEventListener("click", resetAll);

  document.querySelectorAll("[data-setting-toggle]").forEach((toggle) => {
    toggle.addEventListener("change", () => {
      state.settings[toggle.dataset.settingToggle] = toggle.checked;
      saveState();
      render();
    });
  });
  document.getElementById("companyNameInput")?.addEventListener("input", (e) => {
    state.settings.companyName = e.target.value;
    saveState();
  });

  document.getElementById("orderQueryInput")?.addEventListener("input", (e) => {
    state.orderQuery = e.target.value;
    render();
  });
  document.getElementById("statusFilterSelect")?.addEventListener("change", (e) => {
    state.orderStatusFilter = e.target.value;
    render();
  });

  document.querySelectorAll("[data-notice]").forEach((btn) => btn.onclick = () => {
    const order = state.orders.find((o) => o.id === btn.dataset.notice);
    if (order) downloadText(`${order.id}_担当者通知.txt`, order.mailText);
  });
  document.querySelectorAll("[data-instruction]").forEach((btn) => btn.onclick = () => {
    const order = state.orders.find((o) => o.id === btn.dataset.instruction);
    if (order) downloadText(`${order.id}_外注指示書.txt`, order.outsourceInstruction || order.notice);
  });
  document.querySelectorAll("[data-line]").forEach((btn) => btn.onclick = () => {
    const order = state.orders.find((o) => o.id === btn.dataset.line);
    if (order) copyText(order.lineText || order.notice);
  });
  document.querySelectorAll("[data-delete-order]").forEach((btn) => btn.onclick = () => {
    if (!window.confirm("この案件を削除しますか？")) return;
    state.orders = state.orders.filter((o) => o.id !== btn.dataset.deleteOrder);
    saveState();
    render();
  });

  document.getElementById("prevMonthBtn")?.addEventListener("click", () => {
    state.calendarAnchor = new Date(state.calendarAnchor.getFullYear(), state.calendarAnchor.getMonth() - 1, 1);
    render();
  });
  document.getElementById("nextMonthBtn")?.addEventListener("click", () => {
    state.calendarAnchor = new Date(state.calendarAnchor.getFullYear(), state.calendarAnchor.getMonth() + 1, 1);
    render();
  });

  document.getElementById("openStaffCreate")?.addEventListener("click", () => {
    state.staffDraft = { name: "", role: "デザイナー", email: "", hoursPerDay: 8, skills: [], status: "稼働中" };
    state.staffDialogOpen = true;
    render();
  });
  document.querySelectorAll("[data-edit-staff]").forEach((btn) => btn.onclick = () => {
    const found = state.staff.find((s) => s.id === btn.dataset.editStaff);
    if (!found) return;
    state.staffDraft = JSON.parse(JSON.stringify(found));
    state.staffDialogOpen = true;
    render();
  });
  document.querySelectorAll("[data-delete-staff]").forEach((btn) => btn.onclick = () => {
    if (!window.confirm("このスタッフを削除しますか？")) return;
    state.staff = state.staff.filter((s) => s.id !== btn.dataset.deleteStaff);
    saveState();
    render();
  });
  document.getElementById("closeStaffDialog")?.addEventListener("click", () => { state.staffDialogOpen = false; render(); });
  document.getElementById("cancelStaffDialog")?.addEventListener("click", () => { state.staffDialogOpen = false; render(); });
  document.querySelectorAll("[data-staff]").forEach((input) => input.addEventListener("input", () => {
    const key = input.dataset.staff;
    if (key === "hoursPerDay") state.staffDraft[key] = Number(input.value) || 8;
    else if (key === "skills") state.staffDraft[key] = input.value.split(",").map((s) => s.trim()).filter(Boolean);
    else state.staffDraft[key] = input.value;
  }));
  document.getElementById("saveStaffDialog")?.addEventListener("click", () => {
    const draft = state.staffDraft;
    if (!draft?.name) return;
    if (draft.id) state.staff = state.staff.map((s) => s.id === draft.id ? draft : s);
    else state.staff.unshift({ ...draft, id: `st-${Date.now()}` });
    state.staffDialogOpen = false;
    saveState();
    render();
  });

  document.getElementById("openOutsourceReceive")?.addEventListener("click", () => { state.outsourceDialogOpen = true; render(); });
  document.getElementById("closeOutsourceDialog")?.addEventListener("click", () => { state.outsourceDialogOpen = false; render(); });
  document.getElementById("cancelOutsourceDialog")?.addEventListener("click", () => { state.outsourceDialogOpen = false; render(); });
  document.getElementById("submitOutsourceDialog")?.addEventListener("click", () => {
    const id = document.getElementById("outsourceReceiveId")?.value.trim();
    const memo = document.getElementById("outsourceReceiveMemo")?.value.trim() || "外注先より納品完了";
    if (!id) return;
    receiveCompleted(id, memo);
    state.outsourceDialogOpen = false;
    render();
  });
  document.querySelectorAll("[data-receive-now]").forEach((btn) => btn.onclick = () => receiveCompleted(btn.dataset.receiveNow, "外注先より納品完了"));

  document.getElementById("closeCreateDialog")?.addEventListener("click", closeCreateDialog);
  document.getElementById("cancelCreateDialog")?.addEventListener("click", closeCreateDialog);
  document.querySelectorAll("[data-create-tab]").forEach((btn) => btn.onclick = () => { state.createTab = btn.dataset.createTab; render(); });
  document.querySelectorAll("[data-form]").forEach((input) => input.addEventListener("input", () => {
    state.createForm[input.dataset.form] = input.value;
    if (input.dataset.form === "templateId") {
      const tpl = state.templates.find((t) => t.id === input.value);
      if (tpl) {
        state.createForm.projectName = state.createForm.projectName || tpl.title;
        state.createForm.amount = state.createForm.amount || String(tpl.price);
        state.createForm.details = state.createForm.details || `${tpl.title}に関する制作依頼。標準工程に沿って進行。`;
      }
    }
    render();
  }));
  document.getElementById("submitCreateDialog")?.addEventListener("click", () => {
    const form = state.createForm;
    if (!(form.client && form.projectName && form.templateId && form.deadline)) return;
    const payload = buildOrderPayload(form);
    if (!payload) return;
    state.orders.unshift(payload);
    state.currentPage = "orders";
    state.createOpen = false;
    saveState();
    render();
  });

  document.getElementById("pdfInput")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    state.createForm.briefFileName = file.name;
    state.pdfReadMessage = "";
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      state.pdfReadMessage = "PDF以外も添付できますが、自動読込はPDFに最適化しています。";
      render();
      return;
    }
    try {
      state.pdfReading = true;
      render();
      const pdfjsLib = globalThis.pdfjsLib;
      if (!pdfjsLib) throw new Error("pdf.js not loaded");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      let text = "";
      const maxPages = Math.min(pdf.numPages, 8);
      for (let i = 1; i <= maxPages; i += 1) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += ` ${content.items.map((item) => item.str || "").join(" ")}`;
      }
      const normalized = text.replace(/\s+/g, " ").trim();
      const baseName = file.name.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ");
      const hitTemplate = state.templates.find((tpl) => normalized.includes(tpl.category) || normalized.includes(tpl.title));
      const pickedTemplate = hitTemplate?.id || state.templates[0]?.id || "";
      const pickedClient = (/株式会社[^\s、。,]*/.exec(normalized)?.[0]) || state.createForm.client || "未設定顧客";
      const pickedProject = (/案件名[:：]?\s*([^\n]+?)(?:納期|金額|仕様|$)/.exec(normalized)?.[1]?.trim()) || baseName || hitTemplate?.title || "PDF読込案件";
      const pickedAmount = (/([0-9]{2,3}(?:,[0-9]{3})+)円/.exec(normalized)?.[1]?.replace(/,/g, "")) || state.createForm.amount;
      const pickedDeadline = (/20[0-9]{2}[\/\-][0-9]{1,2}[\/\-][0-9]{1,2}/.exec(normalized)?.[0] || "").replace(/\//g, "-");
      state.createForm = {
        ...state.createForm,
        briefFileName: file.name,
        client: pickedClient,
        clientEmail: state.createForm.clientEmail || "pending@example.jp",
        projectName: pickedProject,
        templateId: pickedTemplate || state.createForm.templateId,
        amount: pickedAmount || state.createForm.amount,
        details: normalized.slice(0, 700) || state.createForm.details,
        deadline: pickedDeadline || state.createForm.deadline,
      };
      state.pdfReadMessage = "PDFを読み込みました。手入力タブに戻って、足りない項目だけ補って登録してください。";
      state.createTab = "manual";
    } catch (err) {
      console.error(err);
      state.pdfReadMessage = "PDFの読込に失敗しました。ファイル名は保持して手入力で続けられます。";
    } finally {
      state.pdfReading = false;
      render();
    }
  });
}

loadState();
render();
