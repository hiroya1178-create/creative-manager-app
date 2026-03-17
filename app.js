import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.min.mjs';

const STORAGE_KEY = 'creative-manager-static-v1';
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.mjs';

const state = {
  currentPage: 'dashboard',
  templates: [
    { id:'tpl-001', title:'ロゴデザイン基本', category:'ロゴデザイン', hours:24, price:150000, tasks:[['ヒアリング・構想','4時間'],['ラフスケッチ作成','6時間'],['デザイン制作','8時間'],['修正対応','4時間'],['データ納品','2時間']], icon:'✏️' },
    { id:'tpl-002', title:'ウェブサイトデザイン', category:'ウェブデザイン', hours:60, price:500000, tasks:[['ディレクション','10時間'],['ワイヤーフレーム','12時間'],['トップページ制作','18時間'],['下層ページ制作','14時間'],['レスポンシブ対応','6時間']], icon:'🌐' },
    { id:'tpl-003', title:'パッケージデザイン', category:'パッケージ', hours:40, price:300000, tasks:[['コンセプト設計','8時間'],['デザイン制作','12時間'],['展開パターン作成','8時間'],['入稿データ作成','8時間'],['最終確認','4時間']], icon:'📦' },
    { id:'tpl-004', title:'広告バナー制作', category:'広告デザイン', hours:12, price:80000, tasks:[['構成・コピー確認','2時間'],['デザイン制作','6時間'],['リサイズ対応','3時間'],['最終確認・納品','1時間']], icon:'🖼️' },
  ],
  staff: [
    { id:'st-001', name:'上部 栞絵太', role:'ウェブエンジニア', email:'cweb@design.co.jp', hoursPerDay:8, skills:['ウェブデザイン','インデックス','CSS制作'], status:'稼働中' },
    { id:'st-002', name:'田中 太郎', role:'ディレクター', email:'tanaka@design.co.jp', hoursPerDay:8, skills:['ディレクション','ブランディング','クライアント対応'], status:'稼働中' },
    { id:'st-003', name:'佐藤 花子', role:'デザイナー', email:'sato@design.co.jp', hoursPerDay:8, skills:['ウェブデザイン','UIデザイン','ロゴデザイン'], status:'稼働中' },
    { id:'st-004', name:'鈴木 一郎', role:'イラストレーター', email:'suzuki@design.co.jp', hoursPerDay:8, skills:['イラスト','パッケージデザイン','キャラクターデザイン'], status:'稼働中' },
    { id:'st-005', name:'高橋 美咲', role:'ウェブエンジニア', email:'takahashi@design.co.jp', hoursPerDay:8, skills:['インデックス','WordPress','レスポンシブ'], status:'稼働中' },
  ],
  settings: { companyName:'チャッピー株式会社', autoMail:true, autoOutsource:true, lineReady:true },
  orders: [],
  samplePool: [],
  createOpen: false,
  receiveOpen: false,
  staffOpen: false,
  staffEditing: null,
  orderForm: null,
  orderTab: 'manual',
  pdfReading: false,
  pdfReadMessage: '',
  orderSearch: '',
  orderStatus: 'all',
  calendarDate: new Date(),
};

const navItems = [
  { key:'dashboard', label:'ダッシュボード', icon:'◫' },
  { key:'orders', label:'受注管理', icon:'☰' },
  { key:'templates', label:'テンプレート', icon:'◧' },
  { key:'staff', label:'スタッフ', icon:'◌' },
  { key:'reports', label:'日程', icon:'🗓' },
  { key:'outsource', label:'外注管理', icon:'▣' },
];

const initialForm = () => ({
  client:'', clientEmail:'', templateId:'', details:'', deadline:'', amount:'', briefFileName:'', projectName:'', priority:'通常', deliverable:'AI / PSD / PNG', revisionCount:'2', memo:'', source:'新規受注'
});

const yen = new Intl.NumberFormat('ja-JP', { style:'currency', currency:'JPY', maximumFractionDigits:0 });

function pageTitle(key){ return ({ dashboard:'ダッシュボード', orders:'受注管理', templates:'テンプレート', staff:'スタッフ', reports:'日程', outsource:'外注管理' })[key] || 'デザインマネージャー'; }
function parseAmount(v){ return Number(String(v||'').replace(/[^0-9]/g,'') || 0); }
function statusTone(s){ return s==='納期OK'?'badge badge-ok':s==='納期NG'?'badge badge-ng':s==='納品受信'?'badge badge-violet':'badge badge-out'; }
function judgeTone(s){ return s==='社内対応'?'badge badge-in':s==='外注推奨'?'badge badge-out':s==='納品受信'?'badge badge-violet':'badge'; }
function calcWorkingDays(start,end){ if(!start||!end)return 0; const s=new Date(start), e=new Date(end); if(isNaN(s)||isNaN(e)||e<s) return 0; let c=0; const d=new Date(s); while(d<=e){ const day=d.getDay(); if(day!==0&&day!==6) c++; d.setDate(d.getDate()+1);} return c; }
function addBusinessDays(dateStr,days){ const d=new Date(dateStr); if(isNaN(d)) return '-'; let a=0; while(a<days){ d.setDate(d.getDate()+1); const day=d.getDay(); if(day!==0&&day!==6) a++; } return d.toISOString().slice(0,10); }
function textDownload(name,content){ const b=new Blob([content],{type:'text/plain;charset=utf-8'}); const u=URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download=name; a.click(); URL.revokeObjectURL(u); }
function copyText(text){ navigator.clipboard.writeText(text).catch(()=>{}); }
function staffBusyHoursFromOrders(staffId){ const p=state.staff.find(s=>s.id===staffId); if(!p) return 0; return state.orders.filter(o=>o.assigneeId===staffId&&o.judge!=='納品受信').reduce((sum,o)=>sum + Number(String(o.estimate).replace(/[^0-9]/g,'')||0),0); }
function pickAssignee(template){ const map={ ロゴデザイン:['ロゴデザイン','ブランディング'], ウェブデザイン:['ウェブデザイン','UIデザイン','レスポンシブ'], パッケージ:['パッケージデザイン','イラスト'], 広告デザイン:['クライアント対応','ウェブデザイン','イラスト'] };
  const desired = map[template?.category] || [];
  const sorted = [...state.staff].sort((a,b)=>staffBusyHoursFromOrders(a.id)-staffBusyHoursFromOrders(b.id));
  return sorted.find(m=>desired.some(skill=>m.skills.includes(skill))) || sorted[0];
}
function buildOrderPayload(form){
  const template = state.templates.find(t=>t.id===form.templateId); if(!template) return null;
  const assignee = pickAssignee(template);
  const today = new Date().toISOString().slice(0,10);
  const daysUntil = calcWorkingDays(today, form.deadline || addBusinessDays(today,5));
  const busy = staffBusyHoursFromOrders(assignee.id);
  const capacity = Math.max(daysUntil * assignee.hoursPerDay - busy, 0);
  const priorityBoost = form.priority==='特急'?1.3:form.priority==='高'?1.15:1;
  const adjustedHours = Math.ceil(template.hours * priorityBoost);
  const needOut = state.settings.autoOutsource && adjustedHours > capacity;
  const status = needOut ? '納期NG' : '納期OK';
  const finish = needOut ? (form.deadline || addBusinessDays(today,7)) : addBusinessDays(today, Math.ceil(adjustedHours / assignee.hoursPerDay));
  const notice = needOut
    ? `【要対応】${form.client}様「${form.projectName || template.title}」は社内工数を超過する見込みです。外注候補の選定と指示書作成をお願いします。納期: ${form.deadline || '未設定'} / 想定工数: ${adjustedHours}時間`
    : `【対応可能】${form.client}様「${form.projectName || template.title}」は${assignee.name}が担当予定です。納期内に対応可能です。完了見込み: ${finish}`;
  const lineText = needOut ? `外注対応が必要です\n案件: ${form.projectName || template.title}\n顧客: ${form.client}\n納期: ${form.deadline || '未設定'}\n担当: ${assignee.name}` : `新規受注\n案件: ${form.projectName || template.title}\n顧客: ${form.client}\n担当: ${assignee.name}\n完了見込み: ${finish}`;
  const mailText = `${state.settings.companyName}\n${assignee.name}さん\n\n${notice}\n\n案件詳細:\n- 顧客: ${form.client}\n- 案件名: ${form.projectName || template.title}\n- 納品形式: ${form.deliverable}\n- 修正回数: ${form.revisionCount}回\n- 備考: ${form.memo || 'なし'}\n`;
  return {
    id:`OD-${Math.floor(1000+Math.random()*9000)}`,
    client:form.client, clientEmail:form.clientEmail, projectName:form.projectName, templateTitle:template.title, category:template.category,
    assignee:assignee.name, assigneeId:assignee.id, estimate:`${adjustedHours}時間`, amount: form.amount ? yen.format(Number(form.amount)) : yen.format(template.price),
    deadline:form.deadline || addBusinessDays(today,7), status, judge: needOut ? '外注推奨':'社内対応', details:form.details, notice, lineText, mailText,
    reportItems: template.tasks.map(([task,hours],i)=>({step:i+1,task,hours})), startDate:today, finishDate:finish,
    outsourceNeeded:needOut, deliverable:form.deliverable, revisionCount:form.revisionCount, memo:form.memo, priority:form.priority,
    outsourceInstruction: needOut ? `【外注指示書】\n会社名: ${state.settings.companyName}\n顧客名: ${form.client}\n案件名: ${form.projectName || template.title}\nカテゴリ: ${template.category}\n納期: ${form.deadline || '未設定'}\n希望納品形式: ${form.deliverable}\n修正回数: ${form.revisionCount}回\n案件詳細: ${form.details}\n備考: ${form.memo || 'なし'}\n` : '',
    createdAt:new Date().toLocaleString('ja-JP'), source:form.source || '新規受注'
  };
}
function randomFrom(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function createSamplePool(){
  const clients=['チャッピー株式会社','鳥取デザイン工房','ソラミチ企画','日本海フーズ','株式会社ライト','KKKスポーツ','山陰テック','砂丘観光PR','Blue Note','未来建設'];
  const projectWords=['春キャンペーン','採用LP','新商品告知','周年ロゴ','Instagram広告','会社案内','展示会パネル','パッケージ刷新','ECバナー','イベントチラシ'];
  const deliverables=['AI / PNG','Figma / PDF','PSD / JPG','AI / SVG / PNG','XD / PDF'];
  const priorities=['通常','高','特急'];
  const combos=[]; let i=0;
  while(combos.length<30){
    const template=state.templates[i % state.templates.length];
    const client=clients[Math.floor(i / state.templates.length) % clients.length];
    combos.push({ client, clientEmail:`sample${i+1}@example.jp`, templateId:template.id, details:`${template.title}をベースにしたランダムサンプル案件です。`, deadlineOffset:3+(i%18), amount:String(template.price+(i%5)*20000), projectName:`${projectWords[i % projectWords.length]} ${i+1}`, priority:priorities[i % priorities.length], deliverable:randomFrom(deliverables), revisionCount:String((i%3)+1), memo:'サンプル自動生成', source:'サンプル案件' });
    i++;
  }
  return combos;
}
function monthMatrix(anchor){ const start=new Date(anchor.getFullYear(),anchor.getMonth(),1); const end=new Date(anchor.getFullYear(),anchor.getMonth()+1,0); const cells=[]; for(let i=0;i<start.getDay();i++) cells.push(null); for(let day=1;day<=end.getDate();day++) cells.push(new Date(anchor.getFullYear(),anchor.getMonth(),day)); while(cells.length%7!==0) cells.push(null); return cells; }

function loadState(){
  try{ const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'); if(saved){ state.orders=saved.orders||[]; state.staff=saved.staff||state.staff; state.settings=saved.settings||state.settings; state.samplePool=saved.samplePool||createSamplePool(); state.calendarDate = saved.calendarDate ? new Date(saved.calendarDate) : new Date(); } else state.samplePool=createSamplePool(); }
  catch{ state.samplePool=createSamplePool(); }
  state.orderForm = initialForm();
}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify({ orders:state.orders, staff:state.staff, settings:state.settings, samplePool:state.samplePool, calendarDate: state.calendarDate.toISOString() })); }

function statCard(title, value, sub, cls, icon){
  return `<div class="card"><div class="stat"><div><div class="stat-title">${title}</div><div class="stat-value">${value}</div><div class="stat-sub">${sub}</div></div><div class="stat-icon ${cls}">${icon}</div></div></div>`;
}
function settingsPanel(readonly=false){
  return `<div class="card card-pad">
    <div class="card-title">運用設定</div>
    <div class="settings-grid">
      <div class="field"><label class="label">会社名</label><input class="input" ${readonly?'readonly':''} data-setting="companyName" value="${state.settings.companyName}"></div>
      <div class="toggle-row"><div><div class="label">通知文面の自動生成</div><div class="small">受注登録時に担当者向け文面を作成</div></div><input type="checkbox" ${state.settings.autoMail?'checked':''} ${readonly?'disabled':''} data-bool="autoMail"></div>
      <div class="toggle-row"><div><div class="label">外注自動判定</div><div class="small">担当者の工数と納期からAI想定判定</div></div><input type="checkbox" ${state.settings.autoOutsource?'checked':''} ${readonly?'disabled':''} data-bool="autoOutsource"></div>
      <div class="toggle-row"><div><div class="label">LINE通知文生成</div><div class="small">自動送信ではなく、送信用テキストを生成します</div></div><input type="checkbox" ${state.settings.lineReady?'checked':''} ${readonly?'disabled':''} data-bool="lineReady"></div>
      ${readonly?'':`<div style="display:flex;gap:12px"><button class="btn" id="resetAllBtn">データ初期化</button><button class="btn">自動保存中</button></div>`}
    </div>
  </div>`;
}

function renderDashboard(){
  const active=state.orders.filter(o=>o.status!=='納期NG').length;
  const ng=state.orders.filter(o=>o.status==='納期NG').length;
  const outsource=state.orders.filter(o=>o.outsourceNeeded).length;
  const totalAmount=state.orders.reduce((sum,o)=>sum+parseAmount(o.amount),0);
  return `
    <div class="page-head"><div><h1 class="h1">ダッシュボード</h1><div class="sub">案件の概要と進捗状況</div></div><div class="card card-pad" style="max-width:220px;background:#f5f3ff;border-color:#ddd6fe"><div style="font-weight:700;color:#6d28d9">${state.settings.companyName}</div><div class="small" style="margin-top:6px;color:#7c3aed">LINE文面生成: ${state.settings.lineReady?'ON':'OFF'}</div></div></div>
    <div class="grid grid-5">
      ${statCard('すべてのプロジェクト',state.orders.length,'登録済み','violet','👜')}
      ${statCard('進行中',active,'アクティブ','sky','◔')}
      ${statCard('納期NG',ng,'要対応','rose','!')}
      ${statCard('外注候補',outsource,'AI判定','amber','↗')}
      ${statCard('スタッフ',state.staff.length,'稼働中','gray','○')}
      ${statCard('受注総額',yen.format(totalAmount),'累計','green','¥')}
    </div>
    <div class="grid grid-3" style="margin-top:20px">
      <div class="card" style="grid-column:span 2"><div class="card-pad"><div class="card-title">最近の受注</div>${state.orders.length===0?'<div class="list-empty">受注データなし</div>':state.orders.slice(0,4).map(o=>`<div style="border:1px solid var(--line);border-radius:16px;padding:16px;margin-bottom:12px;display:flex;justify-content:space-between;gap:12px;align-items:center"><div><div style="font-weight:700">${o.client} / ${o.projectName}</div><div class="small" style="margin-top:6px">担当: ${o.assignee} ・ 納期: ${o.deadline}</div></div><div style="display:flex;gap:8px;flex-wrap:wrap"><span class="${statusTone(o.status)}">${o.status}</span><span class="${judgeTone(o.judge)}">${o.judge}</span></div></div>`).join('')}</div></div>
      ${settingsPanel(false)}
    </div>`;
}

function renderOrders(){
  const filtered=state.orders.filter(o=>[o.id,o.client,o.assignee,o.projectName,o.templateTitle].join(' ').toLowerCase().includes(state.orderSearch.toLowerCase()) && (state.orderStatus==='all' || o.status===state.orderStatus));
  const total=filtered.reduce((sum,o)=>sum+parseAmount(o.amount),0);
  return `
    <div class="page-head"><div><h1 class="h1">受注管理</h1><div class="sub">テンプレートから新規受注を登録</div></div><button class="btn btn-primary" id="openCreateTop">新規受注</button></div>
    <div class="kpis">
      <div class="card card-pad"><div class="stat-title">表示中案件の合計金額</div><div style="font-size:34px;font-weight:800">${yen.format(total)}</div></div>
      <div class="card card-pad"><div class="stat-title">表示件数</div><div style="font-size:34px;font-weight:800">${filtered.length}</div></div>
      <div class="card card-pad"><div class="stat-title">外注候補件数</div><div style="font-size:34px;font-weight:800">${filtered.filter(o=>o.outsourceNeeded).length}</div></div>
    </div>
    <div class="search-row"><div class="search-wrap"><span class="search-icon">⌕</span><input class="input" id="orderSearch" placeholder="お客様名・受注番号で検索..." value="${state.orderSearch}"></div><select class="select" id="orderStatus" style="max-width:180px"><option value="all">すべて</option><option value="納期OK" ${state.orderStatus==='納期OK'?'selected':''}>納期OK</option><option value="納期NG" ${state.orderStatus==='納期NG'?'selected':''}>納期NG</option><option value="納品受信" ${state.orderStatus==='納品受信'?'selected':''}>納品受信</option></select></div>
    <div class="card"><div class="table-head"><div>受注番号</div><div>顧客</div><div>案件名</div><div>カテゴリ</div><div>担当者</div><div>予定</div><div>判定</div><div>ステータス</div><div>操作</div></div>${filtered.length===0?'<div class="list-empty">データなし</div>':filtered.map(o=>`<div class="table-row"><div><b>${o.id}</b></div><div>${o.client}</div><div>${o.projectName}</div><div>${o.category}</div><div>${o.assignee}</div><div>${o.estimate}</div><div><span class="${judgeTone(o.judge)}">${o.judge}</span></div><div><span class="${statusTone(o.status)}">${o.status}</span></div><div class="actions"><button class="btn" data-notice="${o.id}">通知</button>${o.outsourceNeeded?`<button class="btn" data-instruction="${o.id}">指示書</button>`:''}<button class="btn" data-line="${o.id}">LINE文</button><button class="btn btn-danger" data-del-order="${o.id}">削除</button></div></div>`).join('')}</div>`;
}

function renderTemplates(){
  return `<div class="page-head"><div><h1 class="h1">テンプレート</h1><div class="sub">発注テンプレートの管理</div></div><button class="btn btn-primary">新規テンプレート</button></div><div class="templates">${state.templates.map(t=>`<div class="card card-pad"><div class="tpl-head"><div><div style="font-weight:800">${t.title}</div><div style="margin-top:8px"><span class="badge badge-violet">${t.category}</span></div></div><div class="tpl-icon">${t.icon}</div></div><div class="sub" style="margin-top:14px">${t.category}案件の標準テンプレートです。</div><div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:16px;color:var(--muted);font-size:14px"><span>⏱ ${t.hours}時間</span><span>¥ ${yen.format(t.price)}</span><span>≒ ${t.tasks.length}タスク</span></div><div style="margin-top:16px">${t.tasks.map(([task,hour])=>`<div style="display:flex;justify-content:space-between;padding:6px 0;color:#475569"><span>${task}</span><span>${hour}</span></div>`).join('')}</div></div>`).join('')}</div>`;
}

function renderStaff(){
  return `<div class="page-head"><div><h1 class="h1">スタッフ</h1><div class="sub">担当者の管理と稼働状況</div></div><button class="btn btn-primary" id="addStaffBtn">新規スタッフ</button></div><div class="staff-grid">${state.staff.map(p=>{ const busy=staffBusyHoursFromOrders(p.id); const progress=Math.min(Math.round((busy/40)*100),100); return `<div class="card card-pad"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div style="display:flex;gap:12px;align-items:center"><div class="avatar">${p.name.slice(0,1)}</div><div><div style="font-weight:800">${p.name}</div><div class="small" style="margin-top:4px">${p.role}</div></div></div><span class="badge badge-ok">${p.status}</span></div><div style="margin-top:16px;display:grid;gap:8px;color:var(--muted);font-size:14px"><div>✉ ${p.email}</div><div>⏱ ${p.hoursPerDay}時間/日</div></div><div style="margin-top:16px"><div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:8px"><span style="color:var(--muted)">稼働状況（AI算出）</span><b>${busy}時間</b></div><div class="progress"><div style="width:${progress}%"></div></div></div><div class="skill-wrap" style="margin-top:16px">${p.skills.map(s=>`<span class="skill">${s}</span>`).join('')}</div><div class="actions" style="margin-top:16px"><button class="icon-btn" data-edit-staff="${p.id}">✎</button><button class="icon-btn" data-del-staff="${p.id}">🗑</button></div></div>`; }).join('')}</div>`;
}

function renderReports(){
  const weekdays=['日','月','火','水','木','金','土'];
  const anchor=state.calendarDate; const cells=monthMatrix(anchor); const map=new Map();
  state.orders.forEach(o=>{ const d=new Date(o.finishDate); if(!isNaN(d)&&d.getFullYear()===anchor.getFullYear()&&d.getMonth()===anchor.getMonth()){ const k=d.toDateString(); if(!map.has(k)) map.set(k,[]); map.get(k).push(o);} });
  return `<div class="page-head"><div><h1 class="h1">日程</h1><div class="sub">業務内容から自動生成された作業日程一覧</div></div></div>
  <div class="card card-pad"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px"><div class="card-title" style="margin:0">カレンダー表示</div><div style="display:flex;gap:8px;align-items:center"><button class="btn" id="prevMonth">前月</button><div style="min-width:120px;text-align:center;font-weight:700">${anchor.getFullYear()}年 ${anchor.getMonth()+1}月</div><button class="btn" id="nextMonth">次月</button></div></div><div class="calendar-head">${weekdays.map(d=>`<div>${d}</div>`).join('')}</div><div class="calendar-grid">${cells.map(cell=>{ if(!cell) return '<div class="calendar-empty"></div>'; const items=map.get(cell.toDateString())||[]; return `<div class="calendar-cell"><div class="calendar-date">${cell.getDate()}</div>${items.slice(0,3).map(i=>`<div class="calendar-item">${i.projectName}</div>`).join('')}${items.length>3?`<div class="small">+${items.length-3}件</div>`:''}</div>`; }).join('')}</div></div>
  <div class="card card-pad" style="margin-top:20px">${state.orders.length===0?'<div class="list-empty"><div>日程はまだありません</div><div style="margin-top:6px">受注処理を実行すると自動的に日程が作成されます</div></div>':state.orders.map(o=>`<div class="card card-pad" style="margin-bottom:14px;border-radius:20px"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;margin-bottom:16px"><div><div style="font-weight:800">${o.client} / ${o.projectName}</div><div class="small" style="margin-top:6px">開始: ${o.startDate} ・ 完了見込み: ${o.finishDate}</div></div><div style="display:flex;gap:8px;flex-wrap:wrap"><span class="${statusTone(o.status)}">${o.status}</span><span class="${judgeTone(o.judge)}">${o.judge}</span></div></div><div class="grid grid-2">${o.reportItems.map(i=>`<div class="info-box"><div>${i.step}. ${i.task}</div><div class="small" style="margin-top:6px">${i.hours}</div></div>`).join('')}</div></div>`).join('')}</div>`;
}

function renderOutsource(){
  const items=state.orders.filter(o=>o.outsourceNeeded);
  const total=items.reduce((sum,o)=>sum+parseAmount(o.amount),0);
  return `<div class="page-head"><div><h1 class="h1">外注管理</h1><div class="sub">外注指示書管理・送信・戻り案件受信</div></div><button class="btn btn-primary" id="receiveOpenBtn">外注完了案件を受信</button></div><div class="grid grid-2"><div class="card card-pad"><div class="stat-title">外注候補の合計金額</div><div style="font-size:34px;font-weight:800">${yen.format(total)}</div></div><div class="card card-pad"><div class="stat-title">外注候補件数</div><div style="font-size:34px;font-weight:800">${items.length}</div></div></div><div class="card card-pad" style="margin-top:20px">${items.length===0?'<div class="list-empty">外注依頼はまだありません<br>AI自動処理で外注が必要と判断された場合に作成されます</div>':items.map(o=>`<div class="card card-pad" style="margin-bottom:14px;border-radius:20px"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><div style="font-weight:800">${o.client} / ${o.projectName}</div><div class="small" style="margin-top:6px">納期: ${o.deadline} ・ 予算: ${o.amount}</div></div><div class="actions"><button class="btn" data-instruction="${o.id}">指示書DL</button><button class="btn" data-received="${o.id}">受信済みにする</button></div></div><div class="notice" style="margin-top:16px;white-space:pre-wrap">${o.notice}</div></div>`).join('')}</div>`;
}

function renderApp(){
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand"><div class="brand-icon">✦</div><div><div class="brand-title">デザインマネージャー</div><div class="brand-sub">クリエイティブ管理</div></div></div>
        <nav class="nav">${navItems.map(item=>`<button class="nav-btn ${state.currentPage===item.key?'active':''}" data-nav="${item.key}"><span class="nav-label"><span>${item.icon}</span><span>${item.label}</span></span><span>›</span></button>`).join('')}</nav>
        <div class="sidebar-footer"><div class="sidebar-pill">デザインマネージャー 公開版 v1.1</div></div>
      </aside>
      <main class="main">
        <div class="header"><div class="header-title">${pageTitle(state.currentPage)}</div><div class="header-actions"><button class="btn" id="sampleBtn">サンプル1件追加</button><button class="btn btn-primary" id="openCreateBtn">新規受注</button></div></div>
        <div class="page">${state.currentPage==='dashboard'?renderDashboard():state.currentPage==='orders'?renderOrders():state.currentPage==='templates'?renderTemplates():state.currentPage==='staff'?renderStaff():state.currentPage==='reports'?renderReports():renderOutsource()}</div>
      </main>
    </div>
    ${renderCreateModal()}
    ${renderStaffModal()}
    ${renderReceiveModal()}
  `;
  bindEvents();
}

function renderCreateModal(){
  if(!state.createOpen) return '';
  const f=state.orderForm; const aiPreview=(f.templateId && f.projectName && f.client) ? buildOrderPayload(f) : null;
  return `<div class="modal-backdrop"><div class="modal"><div class="modal-head"><div style="font-size:28px;font-weight:800">新規受注登録</div><button class="icon-btn" id="closeCreateModal">✕</button></div><div class="modal-grid"><div class="modal-col"><div class="tabs"><button class="tab ${state.orderTab==='manual'?'active':''}" data-tab="manual">手入力</button><button class="tab ${state.orderTab==='auto'?'active':''}" data-tab="auto">PDF / 発注書読込</button></div>${state.orderTab==='auto' ? `<div class="notice" style="background:#f8fafc;border-color:var(--line);color:#334155"><div style="font-weight:700;margin-bottom:12px">発注書・仕様書を添付してAI自動入力</div><div style="display:flex;justify-content:space-between;gap:12px;align-items:center;background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px"><span>${f.briefFileName || 'ファイルを選択（PDF推奨）'}</span><label><input type="file" id="pdfInput" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" class="hidden"><span class="btn">ファイルを選択</span></label></div>${state.pdfReading || state.pdfReadMessage ? `<div class="notice" style="margin-top:14px">${state.pdfReading?'PDFを解析中です...':state.pdfReadMessage}</div>`:''}<div class="notice" style="margin-top:14px">PDFから、顧客名・案件名・テンプレ候補・詳細文・日付候補を自動反映します。</div></div>` : `<div class="grid grid-2"><div class="field"><label class="label">顧客名 *</label><input class="input" data-form="client" value="${escapeHtml(f.client)}"></div><div class="field"><label class="label">顧客メール</label><input class="input" data-form="clientEmail" value="${escapeHtml(f.clientEmail)}"></div><div class="field"><label class="label">案件名 *</label><input class="input" data-form="projectName" value="${escapeHtml(f.projectName)}"></div><div class="field"><label class="label">優先度</label><select class="select" data-form="priority"><option ${f.priority==='通常'?'selected':''}>通常</option><option ${f.priority==='高'?'selected':''}>高</option><option ${f.priority==='特急'?'selected':''}>特急</option></select></div><div class="field"><label class="label">テンプレート *</label><select class="select" data-form="templateId"><option value="">テンプレートを選択</option>${state.templates.map(t=>`<option value="${t.id}" ${f.templateId===t.id?'selected':''}>${t.title}</option>`).join('')}</select></div><div class="field"><label class="label">受注金額</label><input class="input" data-form="amount" value="${escapeHtml(f.amount)}"></div><div class="field"><label class="label">納品形式</label><input class="input" data-form="deliverable" value="${escapeHtml(f.deliverable)}"></div><div class="field"><label class="label">修正回数</label><input class="input" data-form="revisionCount" value="${escapeHtml(f.revisionCount)}"></div><div class="field" style="grid-column:1/-1"><label class="label">発注詳細</label><textarea class="textarea" data-form="details">${escapeHtml(f.details)}</textarea></div><div class="field"><label class="label">納期 *</label><input type="date" class="input" data-form="deadline" value="${escapeHtml(f.deadline)}"></div><div class="field"><label class="label">社内メモ</label><input class="input" data-form="memo" value="${escapeHtml(f.memo)}"></div></div>`}</div><div class="modal-col right"><div class="card-title">AI判定プレビュー</div><div class="card card-pad" style="box-shadow:none">${!aiPreview?'<div class="small">顧客名・案件名・テンプレが入るとプレビュー開始。納期を入れると確定精度が上がります。</div>':`<div class="info-grid"><div class="info-box"><div class="info-label">担当者</div><div class="info-value">${aiPreview.assignee}</div></div><div class="info-box"><div class="info-label">想定工数</div><div class="info-value">${aiPreview.estimate}</div></div><div class="info-box"><div class="info-label">判定</div><div class="info-value">${aiPreview.judge}</div></div><div class="info-box"><div class="info-label">完了見込み</div><div class="info-value">${aiPreview.finishDate}</div></div></div><hr style="border:0;border-top:1px solid var(--line);margin:16px 0"><div class="info-label" style="margin-bottom:8px">通知文面</div><div class="info-box" style="white-space:pre-wrap">${escapeHtml(aiPreview.notice)}</div>`}</div></div></div><div class="modal-foot"><div class="small">${(f.client && f.projectName && f.templateId && f.deadline)?'登録できます':'* 顧客名 / 案件名 / テンプレ / 納期 を入れると登録できます'}</div><div style="display:flex;gap:12px"><button class="btn" id="cancelCreate">キャンセル</button><button class="btn btn-primary" id="submitCreate" ${(f.client && f.projectName && f.templateId && f.deadline)?'':'disabled'}>受注登録</button></div></div></div></div>`;
}
function renderStaffModal(){
  if(!state.staffOpen) return '';
  const p=state.staffEditing || { name:'', role:'デザイナー', email:'', hoursPerDay:8, skills:[] };
  return `<div class="modal-backdrop"><div class="modal small"><div class="modal-head"><div style="font-size:24px;font-weight:800">${p.id?'スタッフ編集':'スタッフ追加'}</div><button class="icon-btn" id="closeStaffModal">✕</button></div><div class="modal-body"><div class="field"><label class="label">氏名</label><input class="input" id="staffName" value="${escapeHtml(p.name||'')}"></div><div class="field"><label class="label">役職</label><input class="input" id="staffRole" value="${escapeHtml(p.role||'')}"></div><div class="field"><label class="label">メール</label><input class="input" id="staffEmail" value="${escapeHtml(p.email||'')}"></div><div class="field"><label class="label">1日稼働時間</label><input class="input" type="number" id="staffHours" value="${p.hoursPerDay||8}"></div><div class="field"><label class="label">スキル（カンマ区切り）</label><input class="input" id="staffSkills" value="${escapeHtml((p.skills||[]).join(', '))}"></div></div><div class="modal-foot"><div></div><div style="display:flex;gap:12px"><button class="btn" id="cancelStaff">キャンセル</button><button class="btn btn-primary" id="saveStaff">保存</button></div></div></div></div>`;
}
function renderReceiveModal(){
  if(!state.receiveOpen) return '';
  return `<div class="modal-backdrop"><div class="modal small"><div class="modal-head"><div style="font-size:24px;font-weight:800">外注完了案件を受信</div><button class="icon-btn" id="closeReceiveModal">✕</button></div><div class="modal-body"><div class="field"><label class="label">受注番号（例: OD-1234）</label><input class="input" id="receiveId"></div><div class="field"><label class="label">受信メモ</label><textarea class="textarea" id="receiveMemo"></textarea></div></div><div class="modal-foot"><div></div><div style="display:flex;gap:12px"><button class="btn" id="cancelReceive">キャンセル</button><button class="btn btn-primary" id="saveReceive">受信登録</button></div></div></div></div>`;
}

function escapeHtml(str){ return String(str||'').replace(/[&<>"']/g, s=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[s])); }

function bindEvents(){
  document.querySelectorAll('[data-nav]').forEach(btn=>btn.onclick=()=>{ state.currentPage=btn.dataset.nav; renderApp(); });
  const sampleBtn=document.getElementById('sampleBtn'); if(sampleBtn) sampleBtn.onclick=createSample;
  const openCreateBtn=document.getElementById('openCreateBtn'); if(openCreateBtn) openCreateBtn.onclick=()=>{ state.createOpen=true; state.orderForm=initialForm(); state.orderTab='manual'; state.pdfReadMessage=''; renderApp(); };
  const openCreateTop=document.getElementById('openCreateTop'); if(openCreateTop) openCreateTop.onclick=()=>{ state.createOpen=true; state.orderForm=initialForm(); state.orderTab='manual'; renderApp(); };
  const addStaffBtn=document.getElementById('addStaffBtn'); if(addStaffBtn) addStaffBtn.onclick=()=>{ state.staffEditing={ name:'', role:'デザイナー', email:'', hoursPerDay:8, skills:[] }; state.staffOpen=true; renderApp(); };
  const receiveOpenBtn=document.getElementById('receiveOpenBtn'); if(receiveOpenBtn) receiveOpenBtn.onclick=()=>{ state.receiveOpen=true; renderApp(); };
  const prevMonth=document.getElementById('prevMonth'); if(prevMonth) prevMonth.onclick=()=>{ state.calendarDate=new Date(state.calendarDate.getFullYear(), state.calendarDate.getMonth()-1, 1); saveState(); renderApp(); };
  const nextMonth=document.getElementById('nextMonth'); if(nextMonth) nextMonth.onclick=()=>{ state.calendarDate=new Date(state.calendarDate.getFullYear(), state.calendarDate.getMonth()+1, 1); saveState(); renderApp(); };
  document.querySelectorAll('[data-setting]').forEach(el=>el.oninput=(e)=>{ state.settings[e.target.dataset.setting]=e.target.value; saveState(); });
  document.querySelectorAll('[data-bool]').forEach(el=>el.onchange=(e)=>{ state.settings[e.target.dataset.bool]=e.target.checked; saveState(); });
  const reset=document.getElementById('resetAllBtn'); if(reset) reset.onclick=()=>{ localStorage.removeItem(STORAGE_KEY); state.orders=[]; state.staff=[...state.staff.slice(0,0),
    { id:'st-001', name:'上部 栞絵太', role:'ウェブエンジニア', email:'cweb@design.co.jp', hoursPerDay:8, skills:['ウェブデザイン','インデックス','CSS制作'], status:'稼働中' },
    { id:'st-002', name:'田中 太郎', role:'ディレクター', email:'tanaka@design.co.jp', hoursPerDay:8, skills:['ディレクション','ブランディング','クライアント対応'], status:'稼働中' },
    { id:'st-003', name:'佐藤 花子', role:'デザイナー', email:'sato@design.co.jp', hoursPerDay:8, skills:['ウェブデザイン','UIデザイン','ロゴデザイン'], status:'稼働中' },
    { id:'st-004', name:'鈴木 一郎', role:'イラストレーター', email:'suzuki@design.co.jp', hoursPerDay:8, skills:['イラスト','パッケージデザイン','キャラクターデザイン'], status:'稼働中' },
    { id:'st-005', name:'高橋 美咲', role:'ウェブエンジニア', email:'takahashi@design.co.jp', hoursPerDay:8, skills:['インデックス','WordPress','レスポンシブ'], status:'稼働中' },]; state.samplePool=createSamplePool(); renderApp(); };
  const orderSearch=document.getElementById('orderSearch'); if(orderSearch) orderSearch.oninput=(e)=>{ state.orderSearch=e.target.value; renderApp(); };
  const orderStatus=document.getElementById('orderStatus'); if(orderStatus) orderStatus.onchange=(e)=>{ state.orderStatus=e.target.value; renderApp(); };
  document.querySelectorAll('[data-notice]').forEach(btn=>btn.onclick=()=>{ const o=state.orders.find(x=>x.id===btn.dataset.notice); if(o) textDownload(`${o.id}_担当者通知.txt`, o.mailText); });
  document.querySelectorAll('[data-instruction]').forEach(btn=>btn.onclick=()=>{ const o=state.orders.find(x=>x.id===btn.dataset.instruction); if(o) textDownload(`${o.id}_外注指示書.txt`, o.outsourceInstruction || o.notice); });
  document.querySelectorAll('[data-line]').forEach(btn=>btn.onclick=()=>{ const o=state.orders.find(x=>x.id===btn.dataset.line); if(o){ copyText(o.lineText||o.notice); alert('LINE通知文をコピーしました'); } });
  document.querySelectorAll('[data-del-order]').forEach(btn=>btn.onclick=()=>{ state.orders=state.orders.filter(o=>o.id!==btn.dataset.delOrder); saveState(); renderApp(); });
  document.querySelectorAll('[data-edit-staff]').forEach(btn=>btn.onclick=()=>{ state.staffEditing={...state.staff.find(s=>s.id===btn.dataset.editStaff)}; state.staffOpen=true; renderApp(); });
  document.querySelectorAll('[data-del-staff]').forEach(btn=>btn.onclick=()=>{ state.staff=state.staff.filter(s=>s.id!==btn.dataset.delStaff); saveState(); renderApp(); });
  document.querySelectorAll('[data-received]').forEach(btn=>btn.onclick=()=>{ receiveCompleted(btn.dataset.received,'外注先より納品完了'); });

  const closeCreate=document.getElementById('closeCreateModal'); if(closeCreate) closeCreate.onclick=()=>{ state.createOpen=false; renderApp(); };
  const cancelCreate=document.getElementById('cancelCreate'); if(cancelCreate) cancelCreate.onclick=()=>{ state.createOpen=false; renderApp(); };
  document.querySelectorAll('[data-tab]').forEach(btn=>btn.onclick=()=>{ state.orderTab=btn.dataset.tab; renderApp(); });
  document.querySelectorAll('[data-form]').forEach(el=>el.oninput=(e)=>{ state.orderForm[e.target.dataset.form]=e.target.value; if(e.target.dataset.form==='templateId'){ autofillFromTemplate(e.target.value); } renderApp(); });
  const pdfInput=document.getElementById('pdfInput'); if(pdfInput) pdfInput.onchange=(e)=>handlePdfUpload(e.target.files?.[0]);
  const submitCreate=document.getElementById('submitCreate'); if(submitCreate) submitCreate.onclick=()=>{ const payload=buildOrderPayload(state.orderForm); if(payload){ state.orders.unshift(payload); state.createOpen=false; state.currentPage='orders'; saveState(); renderApp(); } };

  const closeStaff=document.getElementById('closeStaffModal'); if(closeStaff) closeStaff.onclick=()=>{ state.staffOpen=false; renderApp(); };
  const cancelStaff=document.getElementById('cancelStaff'); if(cancelStaff) cancelStaff.onclick=()=>{ state.staffOpen=false; renderApp(); };
  const saveStaff=document.getElementById('saveStaff'); if(saveStaff) saveStaff.onclick=()=>{ const payload={ ...(state.staffEditing||{}), name:document.getElementById('staffName').value, role:document.getElementById('staffRole').value, email:document.getElementById('staffEmail').value, hoursPerDay:Number(document.getElementById('staffHours').value)||8, skills:document.getElementById('staffSkills').value.split(',').map(s=>s.trim()).filter(Boolean), status:'稼働中' }; if(!payload.name) return; if(payload.id){ state.staff=state.staff.map(s=>s.id===payload.id?payload:s); } else { payload.id=`st-${Date.now()}`; state.staff.unshift(payload); } state.staffOpen=false; saveState(); renderApp(); };

  const closeReceive=document.getElementById('closeReceiveModal'); if(closeReceive) closeReceive.onclick=()=>{ state.receiveOpen=false; renderApp(); };
  const cancelReceive=document.getElementById('cancelReceive'); if(cancelReceive) cancelReceive.onclick=()=>{ state.receiveOpen=false; renderApp(); };
  const saveReceive=document.getElementById('saveReceive'); if(saveReceive) saveReceive.onclick=()=>{ const id=document.getElementById('receiveId').value; const memo=document.getElementById('receiveMemo').value || '外注先より納品完了'; if(!id) return; receiveCompleted(id,memo); state.receiveOpen=false; saveState(); renderApp(); };
}

function autofillFromTemplate(templateId){ const tpl=state.templates.find(t=>t.id===templateId); if(!tpl) return; state.orderForm={ ...state.orderForm, templateId, projectName: state.orderForm.projectName || tpl.title, amount: state.orderForm.amount || String(tpl.price), details: state.orderForm.details || `${tpl.title}に関する制作依頼。標準工程に沿って進行。` }; }
async function handlePdfUpload(file){
  if(!file) return;
  state.orderForm.briefFileName=file.name; state.pdfReadMessage=''; renderApp();
  if(!file.name.toLowerCase().endsWith('.pdf')){ state.pdfReadMessage='PDF以外も添付できますが、自動読込はPDFに最適化しています。'; renderApp(); return; }
  try{
    state.pdfReading=true; renderApp();
    const buffer=await file.arrayBuffer();
    const pdf=await pdfjsLib.getDocument({data:buffer}).promise;
    let text=''; const maxPages=Math.min(pdf.numPages,8);
    for(let i=1;i<=maxPages;i++){ const page=await pdf.getPage(i); const content=await page.getTextContent(); text += ' ' + content.items.map(it=>('str' in it ? it.str : '')).join(' '); }
    const normalized=text.replace(/\s+/g,' ').trim();
    const baseName=file.name.replace(/\.pdf$/i,'').replace(/[_-]+/g,' ');
    const hitTemplate=state.templates.find(t=>normalized.includes(t.category)||normalized.includes(t.title));
    const pickedTemplate=hitTemplate?.id || state.templates[0]?.id || '';
    const pickedClient=(/株式会社[^\s、。,]*/.exec(normalized)?.[0]) || state.orderForm.client || '未設定顧客';
    const pickedProject=(/案件名[:：]?\s*([^\n]+?)(?:納期|金額|仕様|$)/.exec(normalized)?.[1]?.trim()) || baseName || hitTemplate?.title || 'PDF読込案件';
    const pickedAmount=(/([0-9]{2,3}(?:,[0-9]{3})+)円/.exec(normalized)?.[1]?.replace(/,/g,'')) || state.orderForm.amount;
    const pickedDeadline=(/20[0-9]{2}[\/\-][0-9]{1,2}[\/\-][0-9]{1,2}/.exec(normalized)?.[0] || '').replace(/\//g,'-');
    state.orderForm={ ...state.orderForm, briefFileName:file.name, client:pickedClient, clientEmail:state.orderForm.clientEmail||'pending@example.jp', projectName:pickedProject, templateId:pickedTemplate||state.orderForm.templateId, amount:pickedAmount||state.orderForm.amount, details:normalized.slice(0,700)||state.orderForm.details, deadline:pickedDeadline||state.orderForm.deadline };
    state.pdfReadMessage='PDFを読み込みました。足りない項目だけ補って、そのまま登録できます。';
    state.orderTab='manual';
  }catch(e){ console.error(e); state.pdfReadMessage='PDFの読込に失敗しました。ファイル名は保持して手入力で続けられます。'; }
  finally{ state.pdfReading=false; renderApp(); }
}
function createSample(){
  const next=state.samplePool[0];
  if(!next){ state.samplePool=createSamplePool(); saveState(); renderApp(); return; }
  const deadline=new Date(); deadline.setDate(deadline.getDate()+next.deadlineOffset);
  const payload=buildOrderPayload({ ...next, deadline: deadline.toISOString().slice(0,10) });
  if(payload){ state.orders.unshift(payload); state.samplePool=state.samplePool.slice(1); state.currentPage='orders'; saveState(); renderApp(); }
}
function receiveCompleted(id,memo){ state.orders=state.orders.map(o=>o.id===id ? { ...o, outsourceNeeded:false, judge:'納品受信', status:'納品受信', memo:[o.memo,memo].filter(Boolean).join(' / ') } : o); saveState(); renderApp(); }

loadState();
renderApp();
