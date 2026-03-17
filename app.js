import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.min.mjs';

const STORAGE_KEY = 'creative-manager-complete-update-v1';

const navItems = [
  { key: 'dashboard', label: 'ダッシュボード' },
  { key: 'orders', label: '受注管理' },
  { key: 'templates', label: 'テンプレート' },
  { key: 'staff', label: 'スタッフ' },
  { key: 'reports', label: '日程' },
  { key: 'outsource', label: '外注管理' },
];

const templatesSeed = [
  { id:'tpl-001', title:'ロゴデザイン基本', category:'ロゴデザイン', hours:24, price:150000, tasks:[['ヒアリング・構想','4時間'],['ラフスケッチ作成','6時間'],['デザイン制作','8時間'],['修正対応','4時間'],['データ納品','2時間']] },
  { id:'tpl-002', title:'ウェブサイトデザイン', category:'ウェブデザイン', hours:60, price:500000, tasks:[['ディレクション','10時間'],['ワイヤーフレーム','12時間'],['トップページ制作','18時間'],['下層ページ制作','14時間'],['レスポンシブ対応','6時間']] },
  { id:'tpl-003', title:'パッケージデザイン', category:'パッケージ', hours:40, price:300000, tasks:[['コンセプト設計','8時間'],['デザイン制作','12時間'],['展開パターン作成','8時間'],['入稿データ作成','8時間'],['最終確認','4時間']] },
  { id:'tpl-004', title:'広告バナー制作', category:'広告デザイン', hours:12, price:80000, tasks:[['構成・コピー確認','2時間'],['デザイン制作','6時間'],['リサイズ対応','3時間'],['最終確認・納品','1時間']] },
  { id:'tpl-005', title:'LPデザイン制作', category:'ウェブデザイン', hours:36, price:220000, tasks:[['構成整理','4時間'],['ワイヤー作成','6時間'],['デザイン制作','18時間'],['修正','6時間'],['書き出し','2時間']] },
  { id:'tpl-006', title:'イベントチラシ制作', category:'広告デザイン', hours:16, price:95000, tasks:[['情報整理','2時間'],['ラフ作成','3時間'],['デザイン制作','7時間'],['修正','3時間'],['入稿','1時間']] },
];

const staffSeed = [
  { id:'st-001', name:'上部 栞絵太', role:'ウェブエンジニア', email:'cweb@design.co.jp', hoursPerDay:8, busyHours:0, skills:['ウェブデザイン','インデックス','CSS制作'], status:'稼働中' },
  { id:'st-002', name:'田中 太郎', role:'ディレクター', email:'tanaka@design.co.jp', hoursPerDay:8, busyHours:20, skills:['ディレクション','ブランディング','クライアント対応'], status:'稼働中' },
  { id:'st-003', name:'佐藤 花子', role:'デザイナー', email:'sato@design.co.jp', hoursPerDay:8, busyHours:35, skills:['ウェブデザイン','UIデザイン','ロゴデザイン'], status:'稼働中' },
  { id:'st-004', name:'鈴木 一郎', role:'イラストレーター', email:'suzuki@design.co.jp', hoursPerDay:8, busyHours:10, skills:['イラスト','パッケージデザイン','キャラクターデザイン'], status:'稼働中' },
  { id:'st-005', name:'高橋 美咲', role:'ウェブエンジニア', email:'takahashi@design.co.jp', hoursPerDay:8, busyHours:40, skills:['インデックス','WordPress','レスポンシブ'], status:'稼働中' },
];

const initialSettings = { companyName:'チャッピー株式会社', autoMail:true, autoOutsource:true, lineReady:false };
const initialForm = { source:'新規受注', client:'', clientEmail:'', templateId:'', details:'', deadline:'', amount:'', briefFileName:'', projectName:'', priority:'通常', deliverable:'AI / PSD / PNG', revisionCount:'2', memo:'' };

let state = {
  currentPage: 'dashboard',
  templates: structuredClone(templatesSeed),
  staff: structuredClone(staffSeed),
  orders: [],
  settings: structuredClone(initialSettings),
  staffEditingId: null,
};

const $ = (s)=>document.querySelector(s);
const $$ = (s)=>Array.from(document.querySelectorAll(s));
const yen = new Intl.NumberFormat('ja-JP',{style:'currency',currency:'JPY',maximumFractionDigits:0});

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify({orders:state.orders, staff:state.staff, settings:state.settings})); }
function load(){ try{ const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'); if(saved){ state.orders = saved.orders||[]; state.staff = saved.staff||structuredClone(staffSeed); state.settings = {...initialSettings, ...(saved.settings||{})}; } }catch(e){ console.error(e);} }

function randomFrom(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function calcWorkingDays(start,end){ if(!start||!end) return 0; const s=new Date(start), e=new Date(end); if(e<s) return 0; let count=0, c=new Date(s); while(c<=e){ const d=c.getDay(); if(d!==0&&d!==6) count++; c.setDate(c.getDate()+1);} return count; }
function addBusinessDays(dateStr, days){ const d=new Date(dateStr); let added=0; while(added<days){ d.setDate(d.getDate()+1); const g=d.getDay(); if(g!==0&&g!==6) added++; } return d.toLocaleDateString('ja-JP'); }
function statusBadge(status){ if(status==='納期OK') return badge('ok',status); if(status==='納期NG') return badge('ng',status); return badge('warn',status); }
function judgeBadge(judge){ if(judge==='社内対応') return badge('info',judge); if(judge==='外注推奨') return badge('warn',judge); return badge('gray',judge); }
function badge(type,text){ return `<span class="badge ${type}">${text}</span>`; }
function toggleHtml(on){ return `<button class="toggle ${on?'on':''}"></button>`; }

function pickAssignee(template){
  const skillMap = {
    'ロゴデザイン':['ロゴデザイン','ブランディング'],
    'ウェブデザイン':['ウェブデザイン','UIデザイン','レスポンシブ'],
    'パッケージ':['パッケージデザイン','イラスト'],
    '広告デザイン':['クライアント対応','ウェブデザイン','イラスト']
  };
  const desired = skillMap[template?.category] || [];
  const sorted = [...state.staff].sort((a,b)=>a.busyHours-b.busyHours);
  return sorted.find(m=>desired.some(skill=>m.skills.includes(skill))) || sorted[0];
}

function buildOrderPayload(form){
  const template = state.templates.find(t=>t.id===form.templateId);
  if(!template) return null;
  const assignee = pickAssignee(template);
  const today = new Date().toISOString().slice(0,10);
  const daysUntilDeadline = calcWorkingDays(today, form.deadline);
  const internalCapacity = Math.max(daysUntilDeadline * assignee.hoursPerDay - assignee.busyHours, 0);
  const priorityBoost = form.priority==='特急' ? 1.3 : form.priority==='高' ? 1.15 : 1;
  const adjustedHours = Math.ceil(template.hours * priorityBoost);
  const needOutsource = state.settings.autoOutsource && adjustedHours > internalCapacity;
  const status = needOutsource ? '納期NG' : '納期OK';
  const finishDate = needOutsource ? form.deadline : addBusinessDays(today, Math.ceil(adjustedHours / assignee.hoursPerDay));
  const notice = needOutsource
    ? `【要対応】${form.client}様「${form.projectName || template.title}」は社内工数を超過する見込みです。外注候補の選定と指示書作成をお願いします。納期: ${form.deadline} / 想定工数: ${adjustedHours}時間`
    : `【対応可能】${form.client}様「${form.projectName || template.title}」は${assignee.name}が担当予定です。納期内に対応可能です。完了見込み: ${finishDate}`;
  const lineText = needOutsource
    ? `【LINE通知用】外注候補案件\n顧客: ${form.client}\n案件: ${form.projectName}\n納期: ${form.deadline}\n想定工数: ${adjustedHours}時間\n対応: 外注先へ確認お願いします。`
    : `【LINE通知用】新規受注\n顧客: ${form.client}\n案件: ${form.projectName}\n担当: ${assignee.name}\n納期: ${form.deadline}`;
  return {
    id:`OD-${Math.floor(1000+Math.random()*9000)}`,
    source: form.source || '新規受注',
    client: form.client,
    clientEmail: form.clientEmail,
    projectName: form.projectName,
    templateTitle: template.title,
    category: template.category,
    assignee: assignee.name,
    estimate: `${adjustedHours}時間`,
    amount: form.amount ? yen.format(Number(form.amount)) : yen.format(template.price),
    deadline: form.deadline,
    status,
    judge: needOutsource ? '外注推奨' : '社内対応',
    details: form.details,
    notice,
    lineText,
    reportItems: template.tasks.map(([task,hours],i)=>({step:i+1,task,hours})),
    startDate: today,
    finishDate,
    outsourceNeeded: needOutsource,
    deliverable: form.deliverable,
    revisionCount: form.revisionCount,
    memo: form.memo,
    priority: form.priority,
    outsourceInstruction: needOutsource ? `【外注指示書】\n会社名: ${state.settings.companyName}\n顧客名: ${form.client}\n案件名: ${form.projectName}\nカテゴリ: ${template.category}\n納期: ${form.deadline}\n希望納品形式: ${form.deliverable}\n修正回数: ${form.revisionCount}回\n案件詳細: ${form.details}\n備考: ${form.memo || 'なし'}\n` : '',
    createdAt: new Date().toLocaleString('ja-JP')
  };
}

function createRandomOrders(count=30){
  const clients = ['チャッピー株式会社','鳥取デザイン工房','ソラミチ企画','日本海フーズ','株式会社ライト','KKKスポーツ','山陰テック','砂丘観光PR','Blue Note','未来建設'];
  const projectWords = ['春キャンペーン','採用LP','新商品告知','周年ロゴ','Instagram広告','会社案内','展示会パネル','パッケージ刷新','ECバナー','イベントチラシ'];
  const deliverables = ['AI / PNG','Figma / PDF','PSD / JPG','AI / SVG / PNG','XD / PDF'];
  const priorities = ['通常','高','特急'];
  const today = new Date();
  const items=[];
  for(let i=0;i<count;i++){
    const t = randomFrom(state.templates);
    const d = new Date(today); d.setDate(today.getDate()+2+Math.floor(Math.random()*20));
    const payload = buildOrderPayload({
      source:'サンプル案件', client:randomFrom(clients), clientEmail:`contact${i+1}@example.jp`, templateId:t.id,
      details:`${t.title}をベースにしたランダムサンプル案件です。訴求整理、制作、修正、納品まで含みます。`,
      deadline:d.toISOString().slice(0,10), amount:String(t.price + Math.floor(Math.random()*120000)), briefFileName:'',
      projectName:`${randomFrom(projectWords)} ${i+1}`, priority:randomFrom(priorities), deliverable:randomFrom(deliverables), revisionCount:String(1+Math.floor(Math.random()*4)), memo:'サンプル自動生成'
    });
    if(payload) items.push(payload);
  }
  state.orders = [...items, ...state.orders];
  state.currentPage='orders'; save(); render();
}

function downloadText(filename, content){ const blob = new Blob([content],{type:'text/plain;charset=utf-8'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url); }
function copyText(content){ navigator.clipboard.writeText(content).then(()=>alert('コピーしました')); }

function renderNav(){
  const nav = $('#navMenu');
  nav.innerHTML = navItems.map(n=>`<button class="nav-btn ${state.currentPage===n.key?'active':''}" data-nav="${n.key}"><span class="nav-left"><span>${n.label}</span></span><span>›</span></button>`).join('');
  $$('#navMenu [data-nav]').forEach(btn=>btn.onclick=()=>{ state.currentPage=btn.dataset.nav; render(); });
}

function renderHeader(){ $('#pageTitle').textContent = navItems.find(n=>n.key===state.currentPage)?.label || 'ダッシュボード'; }

function renderDashboard(){
  const active = state.orders.filter(o=>o.status!=='納期NG').length;
  const ng = state.orders.filter(o=>o.status==='納期NG').length;
  const outsource = state.orders.filter(o=>o.outsourceNeeded).length;
  return `
    <div class="stack">
      <div class="page-header flex between items-start gap-16">
        <div><h1>ダッシュボード</h1><p>案件の概要と進捗状況</p></div>
        <div class="card"><div class="card-body"><div style="font-weight:700;color:#5b3df5">${state.settings.companyName}</div><div class="muted" style="font-size:12px;margin-top:6px">通知メール自動文面: ${state.settings.autoMail?'ON':'OFF'}</div></div></div>
      </div>
      <div class="grid-5">
        ${statCard('すべてのプロジェクト',state.orders.length,'登録済み')}
        ${statCard('進行中',active,'アクティブ')}
        ${statCard('納期NG',ng,'要対応')}
        ${statCard('外注候補',outsource,'AI判定')}
        ${statCard('スタッフ',state.staff.length,'稼働中')}
      </div>
      <div class="two-grid">
        <div class="card"><div class="card-head"><div class="card-title">最近の受注</div></div><div class="card-body">${state.orders.length? state.orders.slice(0,4).map(o=>`<div class="summary-note" style="margin-bottom:12px"><div style="font-weight:700">${o.client} / ${o.projectName}</div><div class="muted" style="margin-top:6px">担当: ${o.assignee} ・ 納期: ${o.deadline}</div><div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">${statusBadge(o.status)}${judgeBadge(o.judge)}</div></div>`).join('') : '<div class="list-empty">受注データなし</div>'}</div></div>
        ${renderSettingsCard(true)}
      </div>
    </div>`;
}
function statCard(label,value,sub){ return `<div class="card stat"><div class="card-body"><div class="label">${label}</div><div class="value">${value}</div><div class="sub">${sub}</div></div></div>`; }

function renderOrders(){
  return `
    <div class="stack">
      <div class="page-header flex between items-start gap-16"><div><h1>受注管理</h1><p>テンプレートから新規受注を登録</p></div></div>
      <div class="search-row"><input id="orderSearch" placeholder="お客様名・受注番号で検索..."><select id="orderStatusFilter"><option value="all">すべて</option><option value="納期OK">納期OK</option><option value="納期NG">納期NG</option></select></div>
      <div class="card"><div class="card-body" style="padding:0"><div class="order-row order-head"><div>受注番号</div><div>顧客</div><div>案件名</div><div>カテゴリ</div><div>担当者</div><div>予定</div><div>判定</div><div>ステータス</div><div>操作</div></div><div id="ordersTable"></div></div></div>
    </div>`;
}

function fillOrdersTable(){
  const q = ($('#orderSearch')?.value || '').toLowerCase();
  const status = $('#orderStatusFilter')?.value || 'all';
  const filtered = state.orders.filter(o => [o.id,o.client,o.assignee,o.projectName,o.templateTitle].join(' ').toLowerCase().includes(q) && (status==='all' || o.status===status));
  $('#ordersTable').innerHTML = filtered.length ? filtered.map(o=>`
    <div class="order-row">
      <div style="font-weight:700">${o.id}</div>
      <div>${o.client}</div>
      <div>${o.projectName}</div>
      <div>${o.category}</div>
      <div>${o.assignee}</div>
      <div>${o.estimate}</div>
      <div>${judgeBadge(o.judge)}</div>
      <div>${statusBadge(o.status)}</div>
      <div class="table-actions">
        <button class="btn btn-light btn-sm" data-download-notice="${o.id}">通知</button>
        ${o.outsourceNeeded ? `<button class="btn btn-light btn-sm" data-download-inst="${o.id}">指示書</button>` : ''}
        <button class="btn btn-light btn-sm" data-copy-line="${o.id}">LINE文</button>
        <button class="btn btn-light btn-sm" data-delete-order="${o.id}">削除</button>
      </div>
    </div>`).join('') : `<div class="list-empty">データなし</div>`;

  $$('[data-download-notice]').forEach(b=>b.onclick=()=>{ const o=state.orders.find(x=>x.id===b.dataset.downloadNotice); downloadText(`${o.id}_担当者通知.txt`, o.notice); });
  $$('[data-download-inst]').forEach(b=>b.onclick=()=>{ const o=state.orders.find(x=>x.id===b.dataset.downloadInst); downloadText(`${o.id}_外注指示書.txt`, o.outsourceInstruction || o.notice); });
  $$('[data-copy-line]').forEach(b=>b.onclick=()=>{ const o=state.orders.find(x=>x.id===b.dataset.copyLine); copyText(o.lineText); });
  $$('[data-delete-order]').forEach(b=>b.onclick=()=>{ state.orders = state.orders.filter(x=>x.id!==b.dataset.deleteOrder); save(); render(); state.currentPage='orders'; render(); });
}

function renderTemplates(){
  return `<div class="stack"><div class="page-header flex between items-start gap-16"><div><h1>テンプレート</h1><p>発注テンプレートの管理</p></div></div><div class="template-grid">${state.templates.map(t=>`
    <div class="card template-card"><div class="card-body"><div class="flex between items-start gap-12"><div><div style="font-weight:800">${t.title}</div><div style="margin-top:8px">${badge('gray',t.category)}</div></div><div>${badge('info',`${t.hours}時間`)}</div></div><div class="muted" style="margin-top:10px">${yen.format(t.price)} ・ ${t.tasks.length}タスク</div><div class="task-list">${t.tasks.map(([a,b])=>`<div class="task-item"><span>${a}</span><span>${b}</span></div>`).join('')}</div></div></div>`).join('')}</div></div>`;
}

function renderStaff(){
  return `<div class="stack"><div class="page-header flex between items-start gap-16"><div><h1>スタッフ</h1><p>担当者の管理と稼働状況</p></div><button id="openStaffModalBtn" class="btn btn-primary">新規スタッフ</button></div><div class="staff-grid">${state.staff.map(s=>{
    const progress = Math.min(Math.round((s.busyHours/40)*100),100);
    return `<div class="card staff-card"><div class="card-body"><div class="flex between items-start gap-12"><div><div style="font-weight:800">${s.name}</div><div class="muted" style="margin-top:4px">${s.role}</div></div>${badge('ok',s.status)}</div><div class="meta" style="margin-top:12px"><span>${s.email}</span><span>${s.hoursPerDay}時間/日</span></div><div style="margin-top:14px"><div class="flex between"><span class="muted" style="font-size:13px">稼働状況</span><span style="font-size:13px;font-weight:700">${s.busyHours}時間</span></div><div class="progress" style="margin-top:8px"><span style="width:${progress}%"></span></div></div><div class="pill-row" style="margin-top:14px">${s.skills.map(sk=>`<span class="pill">${sk}</span>`).join('')}</div><div class="staff-actions"><input type="number" value="${s.busyHours}" data-staff-busy="${s.id}"><span class="muted" style="font-size:12px">時間</span><div class="table-actions"><button class="btn btn-light btn-sm" data-edit-staff="${s.id}">編集</button><button class="btn btn-light btn-sm" data-delete-staff="${s.id}">削除</button></div></div></div></div>`;
  }).join('')}</div></div>`;
}

function bindStaffPage(){
  $('#openStaffModalBtn').onclick = ()=>openStaffModal();
  $$('[data-staff-busy]').forEach(inp=>inp.onchange=()=>{ const s=state.staff.find(x=>x.id===inp.dataset.staffBusy); if(s){ s.busyHours=Number(inp.value)||0; save(); render(); state.currentPage='staff'; render(); }});
  $$('[data-delete-staff]').forEach(btn=>btn.onclick=()=>{ state.staff = state.staff.filter(x=>x.id!==btn.dataset.deleteStaff); save(); render(); state.currentPage='staff'; render(); });
  $$('[data-edit-staff]').forEach(btn=>btn.onclick=()=>openStaffModal(btn.dataset.editStaff));
}

function renderReports(){
  return `<div class="stack"><div class="page-header"><h1>日程</h1><p>業務内容から自動生成された作業日程一覧</p></div>${state.orders.length? `<div class="report-grid">${state.orders.map(o=>`<div class="card"><div class="card-body"><div class="flex between items-start gap-12"><div><div style="font-weight:800">${o.client} / ${o.projectName}</div><div class="muted" style="margin-top:6px">開始: ${o.startDate} ・ 完了見込み: ${o.finishDate}</div></div><div>${statusBadge(o.status)}</div></div><div class="task-list" style="margin-top:14px">${o.reportItems.map(item=>`<div class="task-item"><span>${item.step}. ${item.task}</span><span>${item.hours}</span></div>`).join('')}</div></div></div>`).join('')}</div>` : `<div class="empty-box">日程はまだありません<br>受注処理を実行すると自動的に日程が作成されます</div>`}</div>`;
}

function renderOutsource(){
  const outs = state.orders.filter(o=>o.outsourceNeeded);
  return `<div class="stack"><div class="page-header flex between items-start gap-16"><div><h1>外注管理</h1><p>外注指示書管理・送信・戻り案件受信</p></div><button id="openReceiveModalBtn" class="btn btn-primary">外注完了案件を受信</button></div>${outs.length? `<div class="out-grid">${outs.map(o=>`<div class="card"><div class="card-body"><div class="flex between items-start gap-12"><div><div style="font-weight:800">${o.client} / ${o.projectName}</div><div class="muted" style="margin-top:6px">納期: ${o.deadline} ・ 予算: ${o.amount}</div></div>${judgeBadge('外注推奨')}</div><div class="notice-box">${o.notice}</div><div class="table-actions" style="margin-top:14px"><button class="btn btn-light btn-sm" data-download-inst="${o.id}">指示書DL</button><button class="btn btn-light btn-sm" data-receive-out="${o.id}">受信済みにする</button><button class="btn btn-light btn-sm" data-copy-line="${o.id}">LINE文</button></div></div></div>`).join('')}</div>` : `<div class="empty-box">外注依頼はまだありません<br>AI自動処理で外注が必要と判断された場合に作成されます</div>`}</div>`;
}

function bindOutsourcePage(){
  $('#openReceiveModalBtn')?.addEventListener('click', ()=>openReceiveModal());
  $$('[data-download-inst]').forEach(b=>b.onclick=()=>{ const o=state.orders.find(x=>x.id===b.dataset.downloadInst); downloadText(`${o.id}_外注指示書.txt`, o.outsourceInstruction || o.notice); });
  $$('[data-receive-out]').forEach(b=>b.onclick=()=>receiveCompleted(b.dataset.receiveOut, '外注先より納品完了'));
  $$('[data-copy-line]').forEach(b=>b.onclick=()=>{ const o=state.orders.find(x=>x.id===b.dataset.copyLine); copyText(o.lineText); });
}

function renderSettingsCard(readonly){
  return `<div class="card settings-box"><div class="card-head"><div class="card-title">運用設定</div></div><div class="card-body stack">
    <div><div style="font-size:14px;font-weight:700;margin-bottom:8px">会社名</div><input id="companyNameInput" ${readonly?'readonly':''} value="${state.settings.companyName}"></div>
    <div class="row"><div><div style="font-weight:700">通知文面の自動生成</div><div class="muted" style="font-size:12px;margin-top:4px">受注登録時に担当者向け文面を作成</div></div><button ${readonly?'disabled':''} id="toggleMail" class="toggle ${state.settings.autoMail?'on':''}"></button></div>
    <div class="row"><div><div style="font-weight:700">外注自動判定</div><div class="muted" style="font-size:12px;margin-top:4px">担当者の工数と納期からAI想定判定</div></div><button ${readonly?'disabled':''} id="toggleOutsource" class="toggle ${state.settings.autoOutsource?'on':''}"></button></div>
    <div class="row"><div><div style="font-weight:700">LINE通知（準備用）</div><div class="muted" style="font-size:12px;margin-top:4px">GitHub Pages単体では自動送信不可。通知文コピー対応。</div></div><button ${readonly?'disabled':''} id="toggleLine" class="toggle ${state.settings.lineReady?'on':''}"></button></div>
    ${readonly ? '' : `<div class="table-actions"><button id="resetBtn" class="btn btn-light">データ初期化</button><button class="btn btn-light">自動保存中</button></div>`}
  </div></div>`;
}

function bindSettings(){
  const c = $('#companyNameInput'); if(c) c.onchange = ()=>{ state.settings.companyName = c.value; save(); render(); };
  const t1 = $('#toggleMail'); if(t1) t1.onclick=()=>{ state.settings.autoMail=!state.settings.autoMail; save(); render(); };
  const t2 = $('#toggleOutsource'); if(t2) t2.onclick=()=>{ state.settings.autoOutsource=!state.settings.autoOutsource; save(); render(); };
  const t3 = $('#toggleLine'); if(t3) t3.onclick=()=>{ state.settings.lineReady=!state.settings.lineReady; save(); render(); };
  const rb = $('#resetBtn'); if(rb) rb.onclick=()=>{ if(confirm('データを初期化しますか？')){ state.orders=[]; state.staff=structuredClone(staffSeed); state.settings=structuredClone(initialSettings); save(); render(); } };
}

function render(){
  renderNav(); renderHeader();
  const page = state.currentPage;
  const content = $('#pageContent');
  if(page==='dashboard') content.innerHTML = renderDashboard();
  if(page==='orders') content.innerHTML = renderOrders();
  if(page==='templates') content.innerHTML = renderTemplates();
  if(page==='staff') content.innerHTML = renderStaff();
  if(page==='reports') content.innerHTML = renderReports();
  if(page==='outsource') content.innerHTML = renderOutsource();

  if(page==='orders'){ $('#orderSearch').oninput=fillOrdersTable; $('#orderStatusFilter').onchange=fillOrdersTable; fillOrdersTable(); }
  if(page==='staff') bindStaffPage();
  if(page==='outsource') bindOutsourcePage();
  if(page==='dashboard') bindSettings();
  if(page==='dashboard') bindSettings();
}

function populateTemplateSelect(){
  $('#fTemplate').innerHTML = `<option value="">テンプレートを選択</option>` + state.templates.map(t=>`<option value="${t.id}">${t.title}</option>`).join('');
}
function getForm(){
  return {
    source:'新規受注', client:$('#fClient').value.trim(), clientEmail:$('#fClientEmail').value.trim(), templateId:$('#fTemplate').value,
    details:$('#fDetails').value.trim(), deadline:$('#fDeadline').value, amount:$('#fAmount').value, briefFileName:$('#pdfFileName').textContent,
    projectName:$('#fProjectName').value.trim(), priority:$('#fPriority').value, deliverable:$('#fDeliverable').value.trim(), revisionCount:$('#fRevisionCount').value.trim(), memo:$('#fMemo').value.trim()
  };
}
function setForm(data){ $('#fClient').value=data.client||''; $('#fClientEmail').value=data.clientEmail||''; $('#fTemplate').value=data.templateId||''; $('#fDetails').value=data.details||''; $('#fDeadline').value=data.deadline||''; $('#fAmount').value=data.amount||''; $('#fProjectName').value=data.projectName||''; $('#fPriority').value=data.priority||'通常'; $('#fDeliverable').value=data.deliverable||'AI / PSD / PNG'; $('#fRevisionCount').value=data.revisionCount||'2'; $('#fMemo').value=data.memo||''; }
function clearForm(){ setForm(initialForm); $('#pdfFileName').textContent='ファイルを選択（PDF推奨）'; $('#pdfMessage').textContent='PDFから顧客名・案件名・詳細文の候補を自動反映します。'; showTab('manual'); renderPreview(); }

function renderPreview(){
  const form = getForm();
  const box = $('#previewBox');
  if(!(form.client && form.projectName && form.templateId && form.deadline)){ box.className='preview-box empty'; box.innerHTML='必須項目入力後に、納期可否・担当者・外注判断を表示します。'; return; }
  const p = buildOrderPayload(form); if(!p){ box.className='preview-box empty'; box.textContent='テンプレート選択後に表示します。'; return; }
  box.className='preview-box';
  box.innerHTML = `<div class="mini-grid">
    <div class="mini-card"><div class="mini-label">担当者</div><div class="mini-value">${p.assignee}</div></div>
    <div class="mini-card"><div class="mini-label">想定工数</div><div class="mini-value">${p.estimate}</div></div>
    <div class="mini-card"><div class="mini-label">判定</div><div class="mini-value">${p.judge}</div></div>
    <div class="mini-card"><div class="mini-label">完了見込み</div><div class="mini-value">${p.finishDate}</div></div>
  </div><div class="notice-box">${p.notice}</div>`;
}

function openModal(){ $('#modalBackdrop').classList.remove('hidden'); $('#orderModal').classList.remove('hidden'); $('#staffModal').classList.add('hidden'); $('#receiveModal').classList.add('hidden'); }
function closeModal(){ $('#modalBackdrop').classList.add('hidden'); clearForm(); }
function openStaffModal(id=null){
  $('#modalBackdrop').classList.remove('hidden'); $('#orderModal').classList.add('hidden'); $('#staffModal').classList.remove('hidden'); $('#receiveModal').classList.add('hidden');
  state.staffEditingId = id;
  const s = id ? state.staff.find(x=>x.id===id) : null;
  $('#sName').value = s?.name || ''; $('#sRole').value = s?.role || 'デザイナー'; $('#sEmail').value = s?.email || ''; $('#sHoursPerDay').value = s?.hoursPerDay || 8; $('#sBusyHours').value = s?.busyHours || 0; $('#sSkills').value = s?.skills?.join(', ') || '';
}
function openReceiveModal(){ $('#modalBackdrop').classList.remove('hidden'); $('#orderModal').classList.add('hidden'); $('#staffModal').classList.add('hidden'); $('#receiveModal').classList.remove('hidden'); $('#rOrderId').value=''; $('#rMemo').value=''; }
function closeSecondaryModals(){ $('#modalBackdrop').classList.add('hidden'); }

function receiveCompleted(id,memo){
  const order = state.orders.find(o=>o.id===id);
  if(!order){ alert('受注番号が見つかりません'); return; }
  order.outsourceNeeded = false;
  order.judge = '納品受信';
  order.status = '納期OK';
  order.memo = [order.memo, memo].filter(Boolean).join(' / ');
  save(); state.currentPage='outsource'; render();
}

async function handlePdfUpload(file){
  if(!file) return;
  $('#pdfFileName').textContent = file.name;
  const lower = file.name.toLowerCase();
  if(!lower.endsWith('.pdf')){ $('#pdfMessage').textContent = 'PDF以外も添付できますが、自動読込はPDFに最適化しています。'; return; }
  try{
    $('#pdfMessage').textContent = 'PDFを解析中です...';
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({data:buffer}).promise;
    let text='';
    const maxPages = Math.min(pdf.numPages, 5);
    for(let i=1;i<=maxPages;i++){
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => 'str' in item ? item.str : '').join(' ');
      text += ' ' + pageText;
    }
    const normalized = text.replace(/\s+/g,' ').trim();
    const hitTemplate = state.templates.find(t => normalized.includes(t.category) || normalized.includes(t.title));
    const pickedTemplate = hitTemplate?.id || state.templates[0]?.id || '';
    const client = (/株式会社[^\s、。,]*/.exec(normalized)?.[0]) || $('#fClient').value;
    const project = (/案件名[:：]?\s*([^\n]+?)(?:納期|金額|$)/.exec(normalized)?.[1]?.trim()) || hitTemplate?.title || 'PDF読込案件';
    const amount = (/([0-9]{2,3}(?:,[0-9]{3})+)円/.exec(normalized)?.[1]?.replace(/,/g,'')) || $('#fAmount').value;
    setForm({ ...getForm(), client, projectName: project, templateId: pickedTemplate, amount, details: normalized.slice(0,500) });
    $('#pdfMessage').textContent = 'PDFを読み込み、入力欄へ反映しました。必要な箇所だけ調整してください。';
    renderPreview();
  }catch(e){ console.error(e); $('#pdfMessage').textContent='PDFの読込で一部うまく取れませんでした。ファイル名は保持し、手入力で続けられます。'; }
}

function showTab(name){
  $$('.tab').forEach(t=>t.classList.toggle('active', t.dataset.tab===name));
  $('#manualTab').classList.toggle('active', name==='manual');
  $('#pdfTab').classList.toggle('active', name==='pdf');
}

function bindGlobal(){
  $('#sampleBtn').onclick = ()=>createRandomOrders(30);
  $('#newOrderBtn').onclick = ()=>openModal();
  $('#closeModalBtn').onclick = closeModal;
  $('#cancelModalBtn').onclick = closeModal;
  $('#closeStaffModalBtn').onclick = closeSecondaryModals;
  $('#cancelStaffBtn').onclick = closeSecondaryModals;
  $('#closeReceiveModalBtn').onclick = closeSecondaryModals;
  $('#cancelReceiveBtn').onclick = closeSecondaryModals;
  $('#saveOrderBtn').onclick = ()=>{
    const form = getForm();
    if(!(form.client && form.clientEmail && form.templateId && form.deadline && form.projectName)){ alert('必須項目を入力してください'); return; }
    const payload = buildOrderPayload(form); if(!payload) return;
    state.orders.unshift(payload); save(); closeModal(); state.currentPage='orders'; render();
  };
  $('#saveStaffBtn').onclick = ()=>{
    const member = { id: state.staffEditingId || `st-${Date.now()}`, name:$('#sName').value.trim(), role:$('#sRole').value.trim(), email:$('#sEmail').value.trim(), hoursPerDay:Number($('#sHoursPerDay').value)||8, busyHours:Number($('#sBusyHours').value)||0, skills:$('#sSkills').value.split(',').map(s=>s.trim()).filter(Boolean), status:'稼働中' };
    if(!member.name){ alert('氏名を入力してください'); return; }
    if(state.staffEditingId){ state.staff = state.staff.map(s=>s.id===state.staffEditingId ? member : s); } else { state.staff.unshift(member); }
    state.staffEditingId = null; save(); closeSecondaryModals(); state.currentPage='staff'; render();
  };
  $('#saveReceiveBtn').onclick = ()=>{ receiveCompleted($('#rOrderId').value.trim(), $('#rMemo').value.trim() || '外注先より納品完了'); closeSecondaryModals(); };
  $$('.tab').forEach(t=>t.onclick=()=>showTab(t.dataset.tab));
  $('#fTemplate').onchange = ()=>{ const tpl=state.templates.find(t=>t.id===$('#fTemplate').value); if(tpl){ if(!$('#fProjectName').value) $('#fProjectName').value=tpl.title; if(!$('#fAmount').value) $('#fAmount').value=tpl.price; if(!$('#fDetails').value) $('#fDetails').value=`${tpl.title}に関する制作依頼。標準工程に沿って進行。`; } renderPreview(); };
  ['#fClient','#fClientEmail','#fProjectName','#fPriority','#fAmount','#fDeliverable','#fRevisionCount','#fDetails','#fDeadline','#fMemo'].forEach(sel=>$(sel).addEventListener('input', renderPreview));
  $('#pdfInput').onchange = (e)=>handlePdfUpload(e.target.files?.[0]);
}

load(); populateTemplateSelect(); renderNav(); renderHeader(); render(); bindGlobal();
