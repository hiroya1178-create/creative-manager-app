const STORAGE_KEY = "creative-manager-public-v1";

const templates = [
  {
    id: "tpl-001",
    title: "ロゴデザイン基本",
    category: "ロゴデザイン",
    hours: 24,
    price: 150000,
    tasks: [["ヒアリング・構想", "4時間"],["ラフスケッチ作成", "6時間"],["デザイン制作", "8時間"],["修正対応", "4時間"],["データ納品", "2時間"]],
  },
  {
    id: "tpl-002",
    title: "ウェブサイトデザイン",
    category: "ウェブデザイン",
    hours: 60,
    price: 500000,
    tasks: [["ディレクション", "10時間"],["ワイヤーフレーム", "12時間"],["トップページ制作", "18時間"],["下層ページ制作", "14時間"],["レスポンシブ対応", "6時間"]],
  },
  {
    id: "tpl-003",
    title: "パッケージデザイン",
    category: "パッケージ",
    hours: 40,
    price: 300000,
    tasks: [["コンセプト設計", "8時間"],["デザイン制作", "12時間"],["展開パターン作成", "8時間"],["入稿データ作成", "8時間"],["最終確認", "4時間"]],
  },
  {
    id: "tpl-004",
    title: "広告バナー制作",
    category: "広告デザイン",
    hours: 12,
    price: 80000,
    tasks: [["構成・コピー確認", "2時間"],["デザイン制作", "6時間"],["リサイズ対応", "3時間"],["最終確認・納品", "1時間"]],
  },
];

const staff = [
  { id: "st-001", name: "上部 栞絵太", role: "ウェブエンジニア", email: "cweb@design.co.jp", hoursPerDay: 8, busyHours: 0, skills: ["ウェブデザイン","インデックス","CSS制作"], status: "稼働中" },
  { id: "st-002", name: "田中 太郎", role: "ディレクター", email: "tanaka@design.co.jp", hoursPerDay: 8, busyHours: 20, skills: ["ディレクション","ブランディング","クライアント対応"], status: "稼働中" },
  { id: "st-003", name: "佐藤 花子", role: "デザイナー", email: "sato@design.co.jp", hoursPerDay: 8, busyHours: 35, skills: ["ウェブデザイン","UIデザイン","ロゴデザイン"], status: "稼働中" },
  { id: "st-004", name: "鈴木 一郎", role: "イラストレーター", email: "suzuki@design.co.jp", hoursPerDay: 8, busyHours: 10, skills: ["イラスト","パッケージデザイン","キャラクターデザイン"], status: "稼働中" },
  { id: "st-005", name: "高橋 美咲", role: "ウェブエンジニア", email: "takahashi@design.co.jp", hoursPerDay: 8, busyHours: 40, skills: ["インデックス","WordPress","レスポンシブ"], status: "稼働中" },
];

let state = {
  orders: [],
  settings: {
    companyName: "チャッピー株式会社",
    autoMail: true,
    autoOutsource: true,
  },
};

const pageTitleMap = {
  dashboard: "ダッシュボード",
  orders: "受注管理",
  templates: "テンプレート",
  staff: "スタッフ",
  reports: "日程",
  outsource: "外注管理",
};

const money = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    state = { ...state, ...parsed };
  } catch (e) {
    console.error(e);
  }
}

function setActivePage(page) {
  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.toggle('active', btn.dataset.page === page));
  document.querySelectorAll('.page').forEach(section => section.classList.toggle('active', section.id === `${page}Page`));
  document.getElementById('pageTitle').textContent = pageTitleMap[page];
}

function businessDaysBetween(start, end) {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e < s) return 0;
  let count = 0;
  const current = new Date(s);
  while (current <= e) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

function addBusinessDays(dateStr, days) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '-';
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return d.toLocaleDateString('ja-JP');
}

function pickAssignee(template) {
  const skillMap = {
    ロゴデザイン: ["ロゴデザイン", "ブランディング"],
    ウェブデザイン: ["ウェブデザイン", "UIデザイン", "レスポンシブ"],
    パッケージ: ["パッケージデザイン", "イラスト"],
    広告デザイン: ["クライアント対応", "ウェブデザイン", "イラスト"],
  };
  const desired = skillMap[template.category] || [];
  const sorted = [...staff].sort((a,b) => a.busyHours - b.busyHours);
  return sorted.find(member => desired.some(skill => member.skills.includes(skill))) || sorted[0];
}

function buildOrder(form) {
  const template = templates.find(t => t.id === form.templateId);
  if (!template) return null;
  const assignee = pickAssignee(template);
  const today = new Date().toISOString().slice(0, 10);
  const daysUntilDeadline = businessDaysBetween(today, form.deadline);
  const internalCapacity = Math.max(daysUntilDeadline * assignee.hoursPerDay - assignee.busyHours, 0);
  const priorityBoost = form.priority === '特急' ? 1.3 : form.priority === '高' ? 1.15 : 1;
  const adjustedHours = Math.ceil(template.hours * priorityBoost);
  const outsourceNeeded = state.settings.autoOutsource && adjustedHours > internalCapacity;
  const status = outsourceNeeded ? '納期NG' : '納期OK';
  const judge = outsourceNeeded ? '外注推奨' : '社内対応';
  const finishDate = outsourceNeeded ? form.deadline : addBusinessDays(today, Math.ceil(adjustedHours / assignee.hoursPerDay));
  const notice = outsourceNeeded
    ? `【要対応】${form.client}様「${form.projectName}」は社内工数を超過する見込みです。外注候補の選定と指示書作成をお願いします。納期: ${form.deadline} / 想定工数: ${adjustedHours}時間`
    : `【対応可能】${form.client}様「${form.projectName}」は${assignee.name}が担当予定です。納期内に対応可能です。完了見込み: ${finishDate}`;
  const mailText = `${state.settings.companyName}\n${assignee.name}さん\n\n${notice}\n\n- 顧客: ${form.client}\n- 案件名: ${form.projectName}\n- テンプレート: ${template.title}\n- 納品形式: ${form.deliverable}\n- 修正回数: ${form.revisionCount}回\n- 備考: ${form.memo || 'なし'}\n`;
  const outsourceInstruction = outsourceNeeded
    ? `【外注指示書】\n会社名: ${state.settings.companyName}\n顧客名: ${form.client}\n案件名: ${form.projectName}\nカテゴリ: ${template.category}\n納期: ${form.deadline}\n希望納品形式: ${form.deliverable}\n修正回数: ${form.revisionCount}回\n案件詳細: ${form.details}\n備考: ${form.memo || 'なし'}\n`
    : '';
  return {
    id: `OD-${Math.floor(1000 + Math.random() * 9000)}`,
    client: form.client,
    clientEmail: form.clientEmail,
    projectName: form.projectName,
    templateTitle: template.title,
    category: template.category,
    assignee: assignee.name,
    estimate: `${adjustedHours}時間`,
    amount: form.amount ? money.format(Number(form.amount)) : money.format(template.price),
    deadline: form.deadline,
    status,
    judge,
    details: form.details,
    notice,
    mailText,
    deliverable: form.deliverable,
    revisionCount: form.revisionCount,
    memo: form.memo,
    priority: form.priority,
    outsourceNeeded,
    outsourceInstruction,
    createdAt: new Date().toLocaleString('ja-JP'),
    startDate: today,
    finishDate,
    reportItems: template.tasks.map((t, i) => ({ step: i + 1, task: t[0], hours: t[1] })),
  };
}

function badge(status, type) {
  const cls = type === 'judge'
    ? (status === '外注推奨' ? 'badge out' : 'badge judge')
    : (status === '納期OK' ? 'badge ok' : 'badge ng');
  return `<span class="${cls}">${status}</span>`;
}

function renderStats() {
  document.getElementById('statTotal').textContent = state.orders.length;
  document.getElementById('statActive').textContent = state.orders.filter(o => o.status !== '納期NG').length;
  document.getElementById('statNg').textContent = state.orders.filter(o => o.status === '納期NG').length;
  document.getElementById('statOutsource').textContent = state.orders.filter(o => o.outsourceNeeded).length;
  document.getElementById('statStaff').textContent = staff.length;
}

function renderRecent() {
  const box = document.getElementById('recentOrders');
  if (!state.orders.length) {
    box.className = 'empty-box';
    box.textContent = '受注データなし';
    return;
  }
  box.className = '';
  box.innerHTML = state.orders.slice(0,4).map(order => `
    <div class="template-card" style="margin-bottom:12px;">
      <div class="name-row"><strong>${order.client} / ${order.projectName}</strong>${badge(order.status)}</div>
      <div class="muted" style="margin-top:8px;">担当: ${order.assignee} ・ 納期: ${order.deadline}</div>
    </div>
  `).join('');
}

function renderOrders() {
  const body = document.getElementById('ordersTableBody');
  const query = document.getElementById('orderSearch').value.trim().toLowerCase();
  const filter = document.getElementById('orderStatusFilter').value;
  const rows = state.orders.filter(order => {
    const q = [order.id, order.client, order.projectName, order.templateTitle].join(' ').toLowerCase();
    const matchQ = !query || q.includes(query);
    const matchS = filter === 'all' || order.status === filter;
    return matchQ && matchS;
  });
  if (!rows.length) {
    body.innerHTML = '<tr><td colspan="9" class="empty-cell">データなし</td></tr>';
    return;
  }
  body.innerHTML = rows.map(order => `
    <tr>
      <td>${order.id}</td>
      <td>${order.client}</td>
      <td>${order.projectName}</td>
      <td>${order.category}</td>
      <td>${order.assignee}</td>
      <td>${order.estimate}</td>
      <td>${badge(order.judge, 'judge')}</td>
      <td>${badge(order.status)}</td>
      <td>
        <div class="actions">
          <button class="btn btn-secondary" onclick="downloadNotice('${order.id}')">通知</button>
          ${order.outsourceNeeded ? `<button class="btn btn-secondary" onclick="downloadInstruction('${order.id}')">指示書</button>` : ''}
          <button class="btn btn-secondary" onclick="deleteOrder('${order.id}')">削除</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderTemplates() {
  document.getElementById('templatesGrid').innerHTML = templates.map(t => `
    <div class="template-card">
      <strong>${t.title}</strong>
      <div class="template-meta"><span>${t.category}</span><span>${t.hours}時間</span><span>${money.format(t.price)}</span></div>
      <div class="template-tasks">
        ${t.tasks.map(task => `<div class="task-row"><span>${task[0]}</span><span>${task[1]}</span></div>`).join('')}
      </div>
    </div>
  `).join('');
}

function renderStaff() {
  document.getElementById('staffGrid').innerHTML = staff.map(s => `
    <div class="staff-card">
      <div class="name-row"><div><strong>${s.name}</strong><div class="muted">${s.role}</div></div><span class="badge ok">${s.status}</span></div>
      <div class="staff-meta"><span>${s.email}</span><span>${s.hoursPerDay}時間/日</span></div>
      <div class="muted">稼働状況 ${s.busyHours}時間</div>
      <div class="progress"><div style="width:${Math.min(Math.round((s.busyHours/40)*100),100)}%"></div></div>
      <div class="skills">${s.skills.map(skill => `<span class="skill-pill">${skill}</span>`).join('')}</div>
    </div>
  `).join('');
}

function renderReports() {
  const box = document.getElementById('reportsList');
  if (!state.orders.length) {
    box.className = 'stack-list empty-box';
    box.textContent = '日程はまだありません';
    return;
  }
  box.className = 'stack-list';
  box.innerHTML = state.orders.map(order => `
    <div class="report-card">
      <div class="report-card-head">
        <div><strong>${order.client} / ${order.projectName}</strong><p>開始: ${order.startDate} ・ 完了見込み: ${order.finishDate}</p></div>
        <div>${badge(order.status)} ${badge(order.judge, 'judge')}</div>
      </div>
      <div class="report-tasks">${order.reportItems.map(item => `<div class="report-item"><span>${item.step}. ${item.task}</span><span>${item.hours}</span></div>`).join('')}</div>
    </div>
  `).join('');
}

function renderOutsource() {
  const box = document.getElementById('outsourceList');
  const rows = state.orders.filter(o => o.outsourceNeeded);
  if (!rows.length) {
    box.className = 'stack-list empty-box';
    box.textContent = '外注依頼はまだありません';
    return;
  }
  box.className = 'stack-list';
  box.innerHTML = rows.map(order => `
    <div class="out-card">
      <div class="out-card-head">
        <div><strong>${order.client} / ${order.projectName}</strong><p>納期: ${order.deadline} ・ 予算: ${order.amount}</p></div>
        <button class="btn btn-secondary" onclick="downloadInstruction('${order.id}')">指示書DL</button>
      </div>
      <div class="muted">${order.notice}</div>
    </div>
  `).join('');
}

function renderPreview() {
  const form = getFormValues();
  const box = document.getElementById('previewBox');
  if (!form.client || !form.projectName || !form.templateId || !form.deadline) {
    box.className = 'empty-box small';
    box.textContent = '必須項目入力後に、納期可否・担当者・外注判断を表示します。';
    return;
  }
  const order = buildOrder(form);
  if (!order) return;
  box.className = '';
  box.innerHTML = `
    <div class="preview-grid">
      <div class="preview-mini"><span>担当者</span><strong>${order.assignee}</strong></div>
      <div class="preview-mini"><span>想定工数</span><strong>${order.estimate}</strong></div>
      <div class="preview-mini"><span>判定</span><strong>${order.judge}</strong></div>
      <div class="preview-mini"><span>完了見込み</span><strong>${order.finishDate}</strong></div>
    </div>
    <div class="template-card" style="padding:14px;">${order.notice}</div>
  `;
}

function getFormValues() {
  return {
    client: document.getElementById('client').value.trim(),
    clientEmail: document.getElementById('clientEmail').value.trim(),
    projectName: document.getElementById('projectName').value.trim(),
    priority: document.getElementById('priority').value,
    templateId: document.getElementById('templateId').value,
    amount: document.getElementById('amount').value,
    deliverable: document.getElementById('deliverable').value.trim(),
    revisionCount: document.getElementById('revisionCount').value.trim(),
    details: document.getElementById('details').value.trim(),
    deadline: document.getElementById('deadline').value,
    memo: document.getElementById('memo').value.trim(),
    briefFileName: document.getElementById('briefFile').files?.[0]?.name || '',
  };
}

function resetForm() {
  document.getElementById('client').value = '';
  document.getElementById('clientEmail').value = '';
  document.getElementById('projectName').value = '';
  document.getElementById('priority').value = '通常';
  document.getElementById('templateId').value = templates[0].id;
  document.getElementById('amount').value = templates[0].price;
  document.getElementById('deliverable').value = 'AI / PSD / PNG';
  document.getElementById('revisionCount').value = '2';
  document.getElementById('details').value = `${templates[0].title}に関する制作依頼。標準工程に沿って進行。`;
  document.getElementById('deadline').value = '';
  document.getElementById('memo').value = '';
  document.getElementById('briefFile').value = '';
  renderPreview();
}

function openModal() { document.getElementById('orderModal').classList.remove('hidden'); }
function closeModal() { document.getElementById('orderModal').classList.add('hidden'); }

function refreshAll() {
  renderStats();
  renderRecent();
  renderOrders();
  renderTemplates();
  renderStaff();
  renderReports();
  renderOutsource();
  document.getElementById('companyName').value = state.settings.companyName;
  document.getElementById('autoMail').checked = state.settings.autoMail;
  document.getElementById('autoOutsource').checked = state.settings.autoOutsource;
}

function createOrder() {
  const form = getFormValues();
  if (!form.client || !form.clientEmail || !form.projectName || !form.templateId || !form.deadline) {
    alert('必須項目を入力してください。');
    return;
  }
  const order = buildOrder(form);
  state.orders.unshift(order);
  saveState();
  refreshAll();
  closeModal();
  setActivePage('orders');
}

function createSampleOrder() {
  const sample = buildOrder({
    client: 'チャッピー株式会社',
    clientEmail: 'info@chappy.co.jp',
    projectName: '採用LPデザイン',
    priority: '高',
    templateId: 'tpl-002',
    amount: '380000',
    deliverable: 'Figma / PNG',
    revisionCount: '2',
    details: '採用向け特設ページデザイン。トップ1P＋下層3P。スマホ対応込み。',
    deadline: new Date(Date.now() + 7*24*60*60*1000).toISOString().slice(0,10),
    memo: '営業確認済み',
    briefFileName: 'sample_brief.pdf',
  });
  state.orders.unshift(sample);
  saveState();
  refreshAll();
  setActivePage('orders');
}

window.downloadNotice = function(id) {
  const order = state.orders.find(o => o.id === id);
  if (!order) return;
  const blob = new Blob([order.mailText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${order.id}_担当者通知.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

window.downloadInstruction = function(id) {
  const order = state.orders.find(o => o.id === id);
  if (!order) return;
  const blob = new Blob([order.outsourceInstruction || order.notice], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${order.id}_外注指示書.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

window.deleteOrder = function(id) {
  if (!confirm('この案件を削除しますか？')) return;
  state.orders = state.orders.filter(o => o.id !== id);
  saveState();
  refreshAll();
};

function initTemplatesSelect() {
  const select = document.getElementById('templateId');
  select.innerHTML = templates.map(t => `<option value="${t.id}">${t.title}</option>`).join('');
  select.value = templates[0].id;
  document.getElementById('amount').value = templates[0].price;
  document.getElementById('details').value = `${templates[0].title}に関する制作依頼。標準工程に沿って進行。`;
}

function setupEvents() {
  document.querySelectorAll('.nav-item').forEach(btn => btn.addEventListener('click', () => setActivePage(btn.dataset.page)));
  document.getElementById('openOrderModalBtn').addEventListener('click', openModal);
  document.getElementById('closeOrderModal').addEventListener('click', closeModal);
  document.getElementById('cancelOrderBtn').addEventListener('click', closeModal);
  document.getElementById('saveOrderBtn').addEventListener('click', createOrder);
  document.getElementById('sampleBtn').addEventListener('click', createSampleOrder);
  document.getElementById('orderSearch').addEventListener('input', renderOrders);
  document.getElementById('orderStatusFilter').addEventListener('change', renderOrders);
  document.getElementById('templateId').addEventListener('change', (e) => {
    const tpl = templates.find(t => t.id === e.target.value);
    if (tpl) {
      document.getElementById('amount').value = tpl.price;
      if (!document.getElementById('projectName').value.trim()) document.getElementById('projectName').value = tpl.title;
      document.getElementById('details').value = `${tpl.title}に関する制作依頼。標準工程に沿って進行。`;
    }
    renderPreview();
  });
  ['client','clientEmail','projectName','priority','amount','deliverable','revisionCount','details','deadline','memo'].forEach(id => {
    document.getElementById(id).addEventListener('input', renderPreview);
    document.getElementById(id).addEventListener('change', renderPreview);
  });
  document.getElementById('companyName').addEventListener('input', (e) => { state.settings.companyName = e.target.value; saveState(); refreshAll(); renderPreview(); });
  document.getElementById('autoMail').addEventListener('change', (e) => { state.settings.autoMail = e.target.checked; saveState(); refreshAll(); renderPreview(); });
  document.getElementById('autoOutsource').addEventListener('change', (e) => { state.settings.autoOutsource = e.target.checked; saveState(); refreshAll(); renderPreview(); });
  document.getElementById('resetDataBtn').addEventListener('click', () => {
    if (!confirm('受注データを初期化しますか？')) return;
    state.orders = [];
    saveState();
    refreshAll();
  });
  document.querySelectorAll('[data-order-tab]').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('[data-order-tab]').forEach(x => x.classList.toggle('active', x === btn));
    const tab = btn.dataset.orderTab;
    document.getElementById('manualTab').classList.toggle('active', tab === 'manual');
    document.getElementById('autoTab').classList.toggle('active', tab === 'auto');
  }));
  document.getElementById('briefFile').addEventListener('change', () => {
    if (document.getElementById('briefFile').files?.[0]) {
      const fileName = document.getElementById('briefFile').files[0].name;
      const tpl = templates[1];
      document.getElementById('projectName').value = '添付資料から自動入力案件';
      document.getElementById('client').value = '自動入力クライアント';
      document.getElementById('clientEmail').value = 'client@example.com';
      document.getElementById('templateId').value = tpl.id;
      document.getElementById('amount').value = tpl.price;
      document.getElementById('details').value = `${fileName} から仕様を読み取り、ウェブサイトデザイン案件として自動補完した想定です。`;
      renderPreview();
    }
  });
  document.getElementById('orderModal').addEventListener('click', (e) => { if (e.target.id === 'orderModal') closeModal(); });
}

function init() {
  loadState();
  initTemplatesSelect();
  setupEvents();
  resetForm();
  refreshAll();
  setActivePage('dashboard');
}

init();
