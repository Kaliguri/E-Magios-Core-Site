const DICE_EVENTS_STORAGE_KEY = 'diceRollEventsLegacy';
const SUPPORTED_DICE = ['d2', 'd4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];

function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return '0%';
  }
  return `${(value * 100).toFixed(2)}%`;
}

function asNumber(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function loadLocalDiceEvents() {
  try {
    const raw = localStorage.getItem(DICE_EVENTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function computeDiceFromEvents(events) {
  const groups = {};
  const userGroups = {};

  events.forEach((event) => {
    if (!event || typeof event !== 'object') {
      return;
    }
    const diceType = String(event.diceType || '').toLowerCase();
    const sides = asNumber(event.sides, 0);
    const result = asNumber(event.result, NaN);
    const userId = String(event.userId || 'anonymous');

    if (!diceType || !Number.isFinite(result) || !Number.isFinite(sides) || sides <= 0) {
      return;
    }

    if (!groups[diceType]) {
      groups[diceType] = { values: [], sides };
    }
    groups[diceType].values.push(result);

    const userKey = `${userId}::${diceType}`;
    if (!userGroups[userKey]) {
      userGroups[userKey] = { userId, diceType, values: [] };
    }
    userGroups[userKey].values.push(result);
  });

  const rollsCountByDiceType = {};
  const avgResultByDiceType = {};
  const theoreticalAvgByDiceType = {};
  const avgDeltaFromTheoretical = {};
  const critFailRate = {};
  const critSuccessRate = {};
  const userAvgVsGlobal = [];

  Object.keys(groups).forEach((diceType) => {
    const pack = groups[diceType];
    const values = pack.values;
    if (!values.length) {
      return;
    }
    const sum = values.reduce((acc, item) => acc + item, 0);
    const avg = sum / values.length;
    const sides = pack.sides;
    const theoretical = (sides + 1) / 2;
    const fails = values.filter((item) => item === 1).length;
    const success = values.filter((item) => item === sides).length;

    rollsCountByDiceType[diceType] = values.length;
    avgResultByDiceType[diceType] = Number(avg.toFixed(4));
    theoreticalAvgByDiceType[diceType] = Number(theoretical.toFixed(4));
    avgDeltaFromTheoretical[diceType] = Number((avg - theoretical).toFixed(4));
    critFailRate[diceType] = Number((fails / values.length).toFixed(4));
    critSuccessRate[diceType] = Number((success / values.length).toFixed(4));
  });

  Object.keys(userGroups).forEach((key) => {
    const pack = userGroups[key];
    const values = pack.values;
    if (!values.length || !avgResultByDiceType[pack.diceType]) {
      return;
    }
    const userAvg = values.reduce((acc, item) => acc + item, 0) / values.length;
    const globalAvg = avgResultByDiceType[pack.diceType];
    userAvgVsGlobal.push({
      userId: pack.userId,
      diceType: pack.diceType,
      userAvg: Number(userAvg.toFixed(4)),
      globalAvg: Number(globalAvg.toFixed(4)),
      delta: Number((userAvg - globalAvg).toFixed(4)),
      rollsCount: values.length
    });
  });

  return {
    status: Object.keys(rollsCountByDiceType).length ? 'ok' : 'insufficient_data',
    reason: Object.keys(rollsCountByDiceType).length ? null : 'No local dice events were found.',
    rollsCountByDiceType,
    avgResultByDiceType,
    theoreticalAvgByDiceType,
    avgDeltaFromTheoretical,
    critFailRate,
    critSuccessRate,
    userAvgVsGlobal
  };
}

function createMetricCard(title, value, hint) {
  const article = document.createElement('article');
  article.className = 'dashboard-card';
  const titleEl = document.createElement('h3');
  titleEl.className = 'dashboard-card-title';
  titleEl.textContent = title;
  const valueEl = document.createElement('p');
  valueEl.className = 'dashboard-card-value';
  valueEl.textContent = value;
  const hintEl = document.createElement('p');
  hintEl.className = 'dashboard-card-hint';
  hintEl.textContent = hint || '';
  article.appendChild(titleEl);
  article.appendChild(valueEl);
  article.appendChild(hintEl);
  return article;
}

function renderQuality(report) {
  const quality = safeObject(report.quality);
  const totals = safeObject(quality.totals);
  const issuesByCollection = safeObject(quality.issuesByCollection);
  const topRules = safeArray(quality.topRules);

  const cards = document.getElementById('quality-cards');
  const byCollection = document.getElementById('quality-by-collection');
  const rules = document.getElementById('quality-top-rules');
  cards.innerHTML = '';
  byCollection.innerHTML = '';
  rules.innerHTML = '';

  cards.appendChild(createMetricCard('Errors', String(asNumber(totals.error, 0)), 'Blocking issues'));
  cards.appendChild(createMetricCard('Warnings', String(asNumber(totals.warning, 0)), 'Needs review'));
  cards.appendChild(createMetricCard('Info', String(asNumber(totals.info, 0)), 'Additional notes'));

  const collectionNames = Object.keys(issuesByCollection).sort();
  if (!collectionNames.length) {
    byCollection.innerHTML = '<tr><td colspan="4" class="no-results">Нет данных</td></tr>';
  } else {
    collectionNames.forEach((name) => {
      const row = document.createElement('tr');
      const data = safeObject(issuesByCollection[name]);
      row.innerHTML = `
        <td>${name}</td>
        <td>${asNumber(data.error, 0)}</td>
        <td>${asNumber(data.warning, 0)}</td>
        <td>${asNumber(data.info, 0)}</td>
      `;
      byCollection.appendChild(row);
    });
  }

  if (!topRules.length) {
    rules.innerHTML = '<li>Нет правил с проблемами</li>';
  } else {
    topRules.slice(0, 8).forEach((item) => {
      const li = document.createElement('li');
      li.textContent = `${item.rule}: ${item.count}`;
      rules.appendChild(li);
    });
  }
}

function renderContent(report) {
  const content = safeObject(report.content);
  const totals = safeObject(content.totals);
  const cards = document.getElementById('content-cards');
  const bars = document.getElementById('content-school-bars');
  cards.innerHTML = '';
  bars.innerHTML = '';

  cards.appendChild(createMetricCard('Spells', String(asNumber(totals.spells, 0)), 'Всего заклинаний'));
  cards.appendChild(createMetricCard('Schools', String(asNumber(totals.schools, 0)), 'Всего школ'));
  cards.appendChild(createMetricCard('Concentration', `${asNumber(content.concentrationShare, 0).toFixed(2)}%`, 'Доля концентрации'));
  cards.appendChild(createMetricCard('Subspells', `${asNumber(content.subspellShare, 0).toFixed(2)}%`, 'Доля подзаклинаний'));
  cards.appendChild(createMetricCard('Incomplete', String(asNumber(content.incompleteObjects, 0)), 'Неполные объекты'));
  cards.appendChild(createMetricCard('Schools without spells', String(asNumber(content.schoolsWithoutSpells, 0)), 'Покрытие школ'));

  const rows = safeArray(content.spellsBySchool).slice(0, 12);
  const maxCount = rows.reduce((acc, row) => Math.max(acc, asNumber(row.count, 0)), 0);
  if (!rows.length || maxCount <= 0) {
    bars.innerHTML = '<p class="text-muted">Недостаточно данных для распределения по школам.</p>';
    return;
  }

  rows.forEach((row) => {
    const school = String(row.school || 'unknown');
    const count = asNumber(row.count, 0);
    const width = Math.max(4, Math.round((count / maxCount) * 100));
    const item = document.createElement('div');
    item.className = 'dashboard-bar-item';
    item.innerHTML = `
      <div class="dashboard-bar-header">
        <span>${school}</span>
        <span>${count}</span>
      </div>
      <div class="dashboard-bar-track">
        <div class="dashboard-bar-fill" style="width: ${width}%"></div>
      </div>
    `;
    bars.appendChild(item);
  });
}

function renderDice(report) {
  const reportDice = safeObject(report.dice);
  const localEvents = loadLocalDiceEvents();
  const localDice = computeDiceFromEvents(localEvents);
  const useLocal = localEvents.length > 0;
  const dice = useLocal ? localDice : reportDice;

  const source = document.getElementById('dice-source');
  const cards = document.getElementById('dice-cards');
  const table = document.getElementById('dice-metrics');
  const users = document.getElementById('dice-user-vs-global');
  cards.innerHTML = '';
  table.innerHTML = '';
  users.innerHTML = '';

  source.textContent = useLocal
    ? 'Источник: localStorage события бросков (diceRollEventsLegacy)'
    : 'Источник: reports/data_report.json';

  const status = String(dice.status || 'insufficient_data');
  if (status !== 'ok') {
    cards.appendChild(createMetricCard('Dice status', status, String(dice.reason || 'No data')));
    table.innerHTML = '<tr><td colspan="7" class="no-results">Недостаточно данных по броскам кубов.</td></tr>';
    users.innerHTML = '<tr><td colspan="5" class="no-results">Нет пользовательских метрик.</td></tr>';
    return;
  }

  const countByType = safeObject(dice.rollsCountByDiceType);
  const totalRolls = Object.keys(countByType).reduce((acc, key) => acc + asNumber(countByType[key], 0), 0);
  cards.appendChild(createMetricCard('Total rolls', String(totalRolls), 'Сумма всех бросков'));
  cards.appendChild(createMetricCard('Active dice types', String(Object.keys(countByType).length), 'Типы кубов с данными'));

  SUPPORTED_DICE.forEach((diceType) => {
    const count = asNumber(countByType[diceType], 0);
    const avg = asNumber(safeObject(dice.avgResultByDiceType)[diceType], 0);
    const theor = asNumber(safeObject(dice.theoreticalAvgByDiceType)[diceType], 0);
    const delta = asNumber(safeObject(dice.avgDeltaFromTheoretical)[diceType], 0);
    const fail = asNumber(safeObject(dice.critFailRate)[diceType], 0);
    const success = asNumber(safeObject(dice.critSuccessRate)[diceType], 0);
    if (count === 0) {
      return;
    }
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${diceType}</td>
      <td>${count}</td>
      <td>${avg.toFixed(3)}</td>
      <td>${theor.toFixed(3)}</td>
      <td>${delta.toFixed(3)}</td>
      <td>${formatPercent(fail)}</td>
      <td>${formatPercent(success)}</td>
    `;
    table.appendChild(row);
  });

  const userRows = safeArray(dice.userAvgVsGlobal).slice(0, 20);
  if (!userRows.length) {
    users.innerHTML = '<tr><td colspan="5" class="no-results">Нет пользовательских метрик.</td></tr>';
  } else {
    userRows.forEach((row) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${String(row.userId || 'anonymous')}</td>
        <td>${String(row.diceType || '-')}</td>
        <td>${asNumber(row.userAvg, 0).toFixed(3)}</td>
        <td>${asNumber(row.globalAvg, 0).toFixed(3)}</td>
        <td>${asNumber(row.delta, 0).toFixed(3)}</td>
      `;
      users.appendChild(tr);
    });
  }
}

async function loadReport() {
  const response = await fetch('reports/data_report.json', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load report (${response.status})`);
  }
  return response.json();
}

async function initDashboard() {
  const status = document.getElementById('dashboard-status');
  try {
    status.textContent = 'Загрузка отчета...';
    const report = await loadReport();
    renderQuality(report);
    renderContent(report);
    renderDice(report);
    status.textContent = `Отчет обновлен: ${new Date(report.generatedAt || Date.now()).toLocaleString()}`;
  } catch (error) {
    status.textContent = `Ошибка загрузки отчета: ${error.message}`;
  }
}

document.addEventListener('DOMContentLoaded', initDashboard);
