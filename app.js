const fields = {
  clientName: document.getElementById('clientName'),
  projectName: document.getElementById('projectName'),
  contentType: document.getElementById('contentType'),
  priority: document.getElementById('priority'),
  dueDate: document.getElementById('dueDate'),
  estimatedHours: document.getElementById('estimatedHours'),
  assignee: document.getElementById('assignee'),
  dailyCapacity: document.getElementById('dailyCapacity'),
  revisionCount: document.getElementById('revisionCount'),
  outsourceAllowed: document.getElementById('outsourceAllowed'),
  details: document.getElementById('details')
};

const outputs = {
  taskCategory: document.getElementById('taskCategory'),
  deadlineJudge: document.getElementById('deadlineJudge'),
  outsourceJudge: document.getElementById('outsourceJudge'),
  requiredDays: document.getElementById('requiredDays'),
  dailyReport: document.getElementById('dailyReport'),
  okNgMessage: document.getElementById('okNgMessage'),
  notificationText: document.getElementById('notificationText'),
  outsourceInstruction: document.getElementById('outsourceInstruction')
};

const emptyState = document.getElementById('emptyState');
const resultArea = document.getElementById('resultArea');

const sampleData = {
  clientName: 'チャッピー株式会社',
  projectName: '春のSNSバナー制作',
  contentType: 'sns',
  priority: 'high',
  dueDate: getFutureDate(3),
  estimatedHours: 18,
  assignee: '田中さん',
  dailyCapacity: 5,
  revisionCount: 2,
  outsourceAllowed: 'yes',
  details: 'Instagram広告用。春キャンペーン訴求。20代〜30代女性向け。1080×1080を3案、ストーリー用1案。桜、やわらかい色味。'
};

function getFutureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function setForm(data) {
  Object.entries(data).forEach(([key, value]) => {
    if (fields[key]) fields[key].value = value;
  });
}

function getFormData() {
  const data = {};
  Object.entries(fields).forEach(([key, el]) => {
    data[key] = el.value;
  });
  data.estimatedHours = Number(data.estimatedHours || 0);
  data.dailyCapacity = Number(data.dailyCapacity || 0);
  data.revisionCount = Number(data.revisionCount || 0);
  return data;
}

function classifyTask(data) {
  const text = `${data.contentType} ${data.details}`.toLowerCase();
  if (text.includes('動画') || data.contentType === 'video') return '動画編集・構成調整案件';
  if (text.includes('lp') || data.contentType === 'lp') return 'LPデザイン案件';
  if (text.includes('sns') || text.includes('instagram') || data.contentType === 'sns') return 'SNSクリエイティブ案件';
  if (text.includes('チラシ') || data.contentType === 'flyer') return '印刷物デザイン案件';
  if (text.includes('バナー') || data.contentType === 'banner') return 'バナーデザイン案件';
  return '汎用クリエイティブ制作案件';
}

function businessDaysUntil(dueDateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  if (Number.isNaN(due.getTime())) return 0;
  let count = 0;
  const current = new Date(today);
  while (current <= due) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count += 1;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

function priorityBuffer(priority) {
  return { low: 0, medium: 1, high: 2, urgent: 3 }[priority] ?? 1;
}

function analyze(data) {
  const taskCategory = classifyTask(data);
  const businessDays = businessDaysUntil(data.dueDate);
  const revisionHours = data.revisionCount * 1.5;
  const totalHours = data.estimatedHours + revisionHours + priorityBuffer(data.priority);
  const capacityHours = businessDays * data.dailyCapacity;
  const requiredDays = data.dailyCapacity > 0 ? Math.ceil(totalHours / data.dailyCapacity) : 0;

  const canMeet = capacityHours >= totalHours && businessDays > 0;
  const outsourceNeeded = !canMeet && data.outsourceAllowed === 'yes';

  const deadlineJudge = canMeet
    ? 'OK：現担当で納期内対応可能'
    : (data.outsourceAllowed === 'yes'
        ? '注意：現担当のみでは厳しいため、外注または再調整が必要'
        : 'NG：現担当のみでは納期に間に合いません');

  const outsourceJudge = outsourceNeeded
    ? '外注推奨：一部または全体の切り出しが必要'
    : (canMeet ? '内製対応：外注なしで進行可能' : '外注不可設定のため社内再調整が必要');

  const okNgMessage = canMeet
    ? `【OK判定】\n${data.clientName}様\n案件「${data.projectName}」は、現在の担当者アサインで納期内対応が可能です。\n制作想定工数は約${totalHours.toFixed(1)}時間、営業日換算で約${requiredDays}日です。\nこのまま制作進行いたします。`
    : `【${outsourceNeeded ? '要外注調整' : 'NG判定'}】\n${data.clientName}様\n案件「${data.projectName}」は、現在の社内稼働のみでは納期達成が難しい状況です。\n想定工数は約${totalHours.toFixed(1)}時間、現在確保できる工数は約${capacityHours.toFixed(1)}時間です。\n${outsourceNeeded ? '外注を含めた進行で調整案を作成します。' : '納期再調整または優先順位変更をご相談ください。'}`;

  const dailyReport = `【作成日報 自動作成】\n案件名：${data.projectName}\n顧客名：${data.clientName}\n担当者：${data.assignee || '未設定'}\n業務分類：${taskCategory}\n想定工数：${totalHours.toFixed(1)}時間\n必要日数：${requiredDays}日\n本日の対応方針：\n- 要件整理と素材確認\n- 初稿制作\n- 修正反映準備\nリスク：${canMeet ? '大きな遅延リスクなし' : '納期逼迫のためアサイン再調整が必要'}\n備考：${data.details}`;

  const notificationText = `件名：案件対応依頼｜${data.projectName}\n\n${data.assignee || '担当者'} 様\n\n以下案件の対応をお願いします。\n- 顧客名：${data.clientName}\n- 案件名：${data.projectName}\n- 業務分類：${taskCategory}\n- 納期：${data.dueDate}\n- 想定工数：${totalHours.toFixed(1)}時間\n- 判定：${deadlineJudge}\n\nコメント：${outsourceNeeded ? '外注併用前提で進行確認をお願いします。' : '社内対応で進行してください。'}\n`;

  const outsourceInstruction = outsourceNeeded
    ? `【外注指示書】\n案件名：${data.projectName}\n顧客名：${data.clientName}\n依頼内容：${data.details}\n必要タスク：初稿制作 / リサイズ / 修正対応\n希望納品日：${data.dueDate}\n想定依頼時間：${Math.max(4, Math.ceil((totalHours - capacityHours) * 10) / 10)}時間\nトーン＆マナー：クライアント既存デザインに準拠\n共有事項：素材、ロゴ、文言は別途共有\n`
    : '外注指示書は不要です。';

  return {
    taskCategory,
    deadlineJudge,
    outsourceJudge,
    requiredDays: `${requiredDays}日（営業日残り：${businessDays}日 / 社内対応可能工数：約${capacityHours.toFixed(1)}時間）`,
    dailyReport,
    okNgMessage,
    notificationText,
    outsourceInstruction,
    meta: {
      totalHours,
      capacityHours,
      businessDays,
      canMeet,
      outsourceNeeded
    }
  };
}

function render(result) {
  emptyState.classList.add('hidden');
  resultArea.classList.remove('hidden');
  Object.entries(outputs).forEach(([key, el]) => {
    el.textContent = result[key] || '';
    if (key === 'deadlineJudge') {
      el.className = result.meta.canMeet ? 'status-ok' : 'status-ng';
    }
    if (key === 'outsourceJudge') {
      el.className = result.meta.outsourceNeeded ? 'status-maybe' : (result.meta.canMeet ? 'status-ok' : 'status-ng');
    }
  });
  window.latestResult = result;
  window.latestForm = getFormData();
}

function downloadText(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById('analyzeBtn').addEventListener('click', () => {
  const data = getFormData();
  if (!data.clientName || !data.projectName || !data.dueDate) {
    alert('顧客名・案件名・納期は入力してください。');
    return;
  }
  render(analyze(data));
});

document.getElementById('resetBtn').addEventListener('click', () => {
  Object.values(fields).forEach((el) => {
    if (el.tagName === 'SELECT') return;
    el.value = '';
  });
  fields.contentType.value = 'banner';
  fields.priority.value = 'medium';
  fields.estimatedHours.value = 8;
  fields.dailyCapacity.value = 6;
  fields.revisionCount.value = 2;
  fields.outsourceAllowed.value = 'yes';
  emptyState.classList.remove('hidden');
  resultArea.classList.add('hidden');
});

document.getElementById('loadSampleBtn').addEventListener('click', () => setForm(sampleData));
document.getElementById('downloadSampleBtn').addEventListener('click', () => {
  downloadText('sample-template.json', JSON.stringify(sampleData, null, 2));
});

document.getElementById('templateFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const json = JSON.parse(text);
    setForm(json);
  } catch (err) {
    alert('JSONファイルの読込に失敗しました。');
  }
});

document.querySelectorAll('[data-download]').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (!window.latestResult) return;
    const key = btn.getAttribute('data-download');
    const map = {
      dailyReport: 'daily-report.txt',
      okNgMessage: 'ok-ng-message.txt',
      notificationText: 'notification.txt',
      outsourceInstruction: 'outsource-instruction.txt'
    };
    downloadText(map[key], window.latestResult[key]);
  });
});

document.getElementById('downloadAllBtn').addEventListener('click', () => {
  if (!window.latestResult || !window.latestForm) return;
  const payload = {
    form: window.latestForm,
    result: window.latestResult,
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'creative-manager-result.json';
  a.click();
  URL.revokeObjectURL(url);
});

setForm(sampleData);
