const DICE_EVENTS_STORAGE_KEY = 'diceRollEventsLegacy';
const SUPPORTED_DICE = ['d2', 'd4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];
const USER_DISPLAY_NAME_BY_UID = {
  '4BzLAuul5UOkokZiXkvMajzDkgq2': 'xGaida',
  NgY5bTPvLohTQZsakTLTSozYbWo1: 'Vakineti',
  fgvej6iwakMQE7hx9rxKpBecxLc2: 'Foxl',
  hYxVKqLCrSUSyut88VXC1XvBt7t1: 'Shieldomirs'
};

const DASHBOARD_LABELS = {
  quality: {
    errorsTitle: 'Ошибки',
    errorsHint: 'Критические проблемы',
    warningsTitle: 'Предупреждения',
    warningsHint: 'Требует проверки',
    infoTitle: 'Инфо',
    infoHint: 'Справочные замечания'
  },
  content: {
    spells: 'Заклинания',
    schools: 'Школы',
    concentration: 'Концентрация',
    subspells: 'Подзаклинания',
    incomplete: 'Неполные объекты',
    schoolsWithoutSpells: 'Школы без заклинаний'
  },
  dice: {
    status: 'Статус бросков',
    totalRolls: 'Всего бросков',
    activeDice: 'Активные типы кубов',
    topRoll: 'Самый популярный бросок',
    topRollHint: 'Доля от общего числа',
    noData: 'Нет данных',
    noLocalReason: 'Локальные события бросков не найдены.',
    noDiceData: 'Недостаточно данных по броскам кубов.',
    noUserMetrics: 'Нет пользовательских метрик.',
    noRollTypeStats: 'Нет статистики по уникальным типам бросков.',
    localSource: 'Источник: localStorage события бросков (diceRollEventsLegacy)',
    reportSource: 'Источник: reports/data_report.json',
    unknown: 'не указан',
    anonymous: 'анонимный'
  }
};

let userModalContext = null;

function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return '0%';
  }
  return `${(value * 100).toFixed(2)}%`;
}

function formatDateTime(timestamp) {
  const date = new Date(asNumber(timestamp, 0));
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleString('ru-RU');
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

function normalizeDiceType(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) {
    return '';
  }
  if (raw.startsWith('d')) {
    return raw;
  }
  const numeric = Number(raw);
  if (Number.isFinite(numeric) && numeric > 0) {
    return `d${Math.trunc(numeric)}`;
  }
  return raw;
}

function parseSidesFromDiceType(diceType) {
  const match = String(diceType || '').match(/^d(\d+)$/i);
  if (!match) {
    return 0;
  }
  return Math.trunc(asNumber(match[1], 0));
}

function normalizeRollContext(event) {
  const direct = String(event.context || '').trim().toLowerCase();
  if (direct) {
    return direct;
  }
  const rollType = String(event.contextRollType || '').trim().toLowerCase();
  if (rollType) {
    return rollType;
  }
  const source = String(event.contextSource || '').trim().toLowerCase();
  if (source.includes('arcana')) {
    return 'arcana';
  }
  if (source.includes('hit')) {
    return 'hit';
  }
  if (source.includes('apply')) {
    return 'apply';
  }
  return 'other';
}

function buildRollTypeLabel(context, diceType, expression) {
  const contextLabelMap = {
    arcana: 'Аркана',
    hit: 'Попадание',
    apply: 'Наложение эффекта',
    other: 'Другое',
    custom_attack: 'Кастомный: атака',
    custom_damage: 'Кастомный: урон',
    custom_control: 'Кастомный: контроль',
    custom_support: 'Кастомный: поддержка'
  };
  const contextLabel = contextLabelMap[context] || context || DASHBOARD_LABELS.dice.unknown;
  const normalizedDiceType = diceType || DASHBOARD_LABELS.dice.unknown;
  const normalizedExpression = expression || normalizedDiceType;
  return `${contextLabel} ${normalizedDiceType.toUpperCase()} (${normalizedExpression})`;
}

function resolveUserDisplayName(userId, row) {
  const fromRow = String(row.userDisplayName || row.userLabel || '').trim();
  if (fromRow) {
    return fromRow;
  }
  if (USER_DISPLAY_NAME_BY_UID[userId]) {
    return USER_DISPLAY_NAME_BY_UID[userId];
  }
  return userId || DASHBOARD_LABELS.dice.anonymous;
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

function computeStats(values, sides) {
  if (!values.length || sides <= 0) {
    return null;
  }
  const sum = values.reduce((acc, item) => acc + item, 0);
  const avg = sum / values.length;
  const theoretical = (sides + 1) / 2;
  const fails = values.filter((item) => item === 1).length;
  const success = values.filter((item) => item === sides).length;
  return {
    count: values.length,
    avg: Number(avg.toFixed(4)),
    theoretical: Number(theoretical.toFixed(4)),
    delta: Number((avg - theoretical).toFixed(4)),
    failRate: Number((fails / values.length).toFixed(4)),
    successRate: Number((success / values.length).toFixed(4))
  };
}

function buildEmptyDiceResult(reason) {
  return {
    status: 'insufficient_data',
    reason,
    rollsCountByDiceType: {},
    avgResultByDiceType: {},
    theoreticalAvgByDiceType: {},
    avgDeltaFromTheoretical: {},
    critFailRate: {},
    critSuccessRate: {},
    userAvgVsGlobal: [],
    userSummaries: [],
    rollTypeStats: [],
    topRollType: null
  };
}

function computeDiceFromEvents(events) {
  const groups = {};
  const userGroups = {};
  const rollGroups = {};
  const userSummariesMap = {};

  events.forEach((event) => {
    if (!event || typeof event !== 'object') {
      return;
    }
    const diceType = normalizeDiceType(event.diceType);
    const sides = Math.trunc(asNumber(event.sides, parseSidesFromDiceType(diceType)));
    const result = Math.trunc(asNumber(event.result, NaN));
    const userId = String(event.userId || DASHBOARD_LABELS.dice.anonymous);
    const createdAt = Math.trunc(asNumber(event.createdAt, 0));
    const context = normalizeRollContext(event);
    const expression = String(event.expression || event.displayExpression || diceType || '').trim();
    const rollTypeKey = String(event.rollTypeKey || `${context}:${diceType}`).trim().toLowerCase();
    const userDisplayName = resolveUserDisplayName(userId, event);

    if (!diceType || !Number.isFinite(result) || !Number.isFinite(sides) || sides <= 0) {
      return;
    }

    if (!groups[diceType]) {
      groups[diceType] = { values: [], sides };
    }
    groups[diceType].values.push(result);

    const userKey = `${userId}::${diceType}`;
    if (!userGroups[userKey]) {
      userGroups[userKey] = { userId, userDisplayName, diceType, values: [] };
    }
    userGroups[userKey].values.push(result);

    if (!rollGroups[rollTypeKey]) {
      rollGroups[rollTypeKey] = {
        rollTypeKey,
        context,
        diceType,
        expression: expression || diceType,
        values: [],
        sides
      };
    }
    rollGroups[rollTypeKey].values.push(result);

    if (!userSummariesMap[userId]) {
      userSummariesMap[userId] = {
        userId,
        userDisplayName,
        rollsCount: 0,
        resultSum: 0,
        deltaSum: 0,
        critFailCount: 0,
        critSuccessCount: 0,
        lastRollAt: createdAt
      };
    }
    const theoretical = (sides + 1) / 2;
    const pack = userSummariesMap[userId];
    pack.userDisplayName = userDisplayName;
    pack.rollsCount += 1;
    pack.resultSum += result;
    pack.deltaSum += result - theoretical;
    if (result === 1) {
      pack.critFailCount += 1;
    }
    if (result === sides) {
      pack.critSuccessCount += 1;
    }
    if (createdAt > pack.lastRollAt) {
      pack.lastRollAt = createdAt;
    }
  });

  const rollsCountByDiceType = {};
  const avgResultByDiceType = {};
  const theoreticalAvgByDiceType = {};
  const avgDeltaFromTheoretical = {};
  const critFailRate = {};
  const critSuccessRate = {};
  const userAvgVsGlobal = [];
  const rollTypeStats = [];

  Object.keys(groups).forEach((diceType) => {
    const pack = groups[diceType];
    const stats = computeStats(pack.values, pack.sides);
    if (!stats) {
      return;
    }
    rollsCountByDiceType[diceType] = stats.count;
    avgResultByDiceType[diceType] = stats.avg;
    theoreticalAvgByDiceType[diceType] = stats.theoretical;
    avgDeltaFromTheoretical[diceType] = stats.delta;
    critFailRate[diceType] = stats.failRate;
    critSuccessRate[diceType] = stats.successRate;
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
      userDisplayName: pack.userDisplayName,
      diceType: pack.diceType,
      userAvg: Number(userAvg.toFixed(4)),
      globalAvg: Number(globalAvg.toFixed(4)),
      delta: Number((userAvg - globalAvg).toFixed(4)),
      rollsCount: values.length
    });
  });

  Object.keys(rollGroups).forEach((rollTypeKey) => {
    const pack = rollGroups[rollTypeKey];
    const stats = computeStats(pack.values, pack.sides);
    if (!stats) {
      return;
    }
    rollTypeStats.push({
      rollTypeKey,
      context: pack.context,
      diceType: pack.diceType,
      expression: pack.expression,
      label: buildRollTypeLabel(pack.context, pack.diceType, pack.expression),
      count: stats.count,
      avg: stats.avg,
      theoreticalAvg: stats.theoretical,
      delta: stats.delta,
      critFailRate: stats.failRate,
      critSuccessRate: stats.successRate
    });
  });

  const userSummaries = Object.values(userSummariesMap)
    .map((pack) => ({
      userId: pack.userId,
      userDisplayName: pack.userDisplayName,
      rollsCount: pack.rollsCount,
      lastRollAt: pack.lastRollAt,
      avgResult: Number((pack.resultSum / Math.max(pack.rollsCount, 1)).toFixed(4)),
      avgDeltaFromTheoretical: Number((pack.deltaSum / Math.max(pack.rollsCount, 1)).toFixed(4)),
      critFailCount: pack.critFailCount,
      critSuccessCount: pack.critSuccessCount,
      critFailRate: Number((pack.critFailCount / Math.max(pack.rollsCount, 1)).toFixed(4)),
      critSuccessRate: Number((pack.critSuccessCount / Math.max(pack.rollsCount, 1)).toFixed(4))
    }))
    .sort((left, right) => {
      if (right.rollsCount !== left.rollsCount) {
        return right.rollsCount - left.rollsCount;
      }
      return String(left.userDisplayName).localeCompare(String(right.userDisplayName), 'ru');
    });

  rollTypeStats.sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }
    return String(left.rollTypeKey).localeCompare(String(right.rollTypeKey), 'ru');
  });

  const totalRolls = Object.keys(rollsCountByDiceType).reduce((acc, key) => acc + asNumber(rollsCountByDiceType[key], 0), 0);
  const topRollType = rollTypeStats.length
    ? {
        ...rollTypeStats[0],
        share: totalRolls > 0 ? Number((rollTypeStats[0].count / totalRolls).toFixed(4)) : 0
      }
    : null;

  if (!Object.keys(rollsCountByDiceType).length) {
    return buildEmptyDiceResult(DASHBOARD_LABELS.dice.noLocalReason);
  }

  return {
    status: 'ok',
    reason: null,
    rollsCountByDiceType,
    avgResultByDiceType,
    theoreticalAvgByDiceType,
    avgDeltaFromTheoretical,
    critFailRate,
    critSuccessRate,
    userAvgVsGlobal,
    userSummaries,
    rollTypeStats,
    topRollType
  };
}

function normalizeDiceReport(reportDice) {
  const dice = safeObject(reportDice);
  if (String(dice.status || 'insufficient_data') !== 'ok') {
    return buildEmptyDiceResult(String(dice.reason || DASHBOARD_LABELS.dice.noData));
  }
  const normalizedUserSummaries = safeArray(dice.userSummaries).map((row) => {
    const userId = String(row.userId || '');
    return {
      ...row,
      userDisplayName: resolveUserDisplayName(userId, row)
    };
  });
  return {
    ...dice,
    rollTypeStats: safeArray(dice.rollTypeStats),
    userSummaries: normalizedUserSummaries,
    topRollType: dice.topRollType || null
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

function closeUserStatsModal() {
  const modal = document.getElementById('user-stats-modal');
  if (!modal) {
    return;
  }
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  userModalContext = null;
}

function openUserStatsModal(summary) {
  const modal = document.getElementById('user-stats-modal');
  const content = document.getElementById('user-stats-content');
  const title = document.getElementById('user-stats-title');
  if (!modal || !content || !title) {
    return;
  }
  userModalContext = summary;
  title.textContent = `Статистика: ${summary.userDisplayName}`;
  content.innerHTML = `
    <div class="results-table">
      <table>
        <tbody>
          <tr><th>Пользователь</th><td>${summary.userDisplayName}</td></tr>
          <tr><th>UID</th><td>${summary.userId}</td></tr>
          <tr><th>Количество бросков</th><td>${asNumber(summary.rollsCount, 0)}</td></tr>
          <tr><th>Среднее значение</th><td>${asNumber(summary.avgResult, 0).toFixed(3)}</td></tr>
          <tr><th>Отклонение</th><td>${asNumber(summary.avgDeltaFromTheoretical, 0).toFixed(3)}</td></tr>
          <tr><th>Крит. провалы</th><td>${asNumber(summary.critFailCount, 0)} (${formatPercent(asNumber(summary.critFailRate, 0))})</td></tr>
          <tr><th>Крит. успехи</th><td>${asNumber(summary.critSuccessCount, 0)} (${formatPercent(asNumber(summary.critSuccessRate, 0))})</td></tr>
          <tr><th>Последний бросок</th><td>${formatDateTime(summary.lastRollAt)}</td></tr>
        </tbody>
      </table>
    </div>
  `;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function setupUserStatsModal() {
  const modal = document.getElementById('user-stats-modal');
  if (!modal) {
    return;
  }
  modal.querySelectorAll('[data-close-user-modal]').forEach((el) => {
    el.addEventListener('click', closeUserStatsModal);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && userModalContext) {
      closeUserStatsModal();
    }
  });
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

  cards.appendChild(createMetricCard(DASHBOARD_LABELS.quality.errorsTitle, String(asNumber(totals.error, 0)), DASHBOARD_LABELS.quality.errorsHint));
  cards.appendChild(createMetricCard(DASHBOARD_LABELS.quality.warningsTitle, String(asNumber(totals.warning, 0)), DASHBOARD_LABELS.quality.warningsHint));
  cards.appendChild(createMetricCard(DASHBOARD_LABELS.quality.infoTitle, String(asNumber(totals.info, 0)), DASHBOARD_LABELS.quality.infoHint));

  const collectionNames = Object.keys(issuesByCollection).sort((left, right) => left.localeCompare(right, 'ru'));
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

  cards.appendChild(createMetricCard(DASHBOARD_LABELS.content.spells, String(asNumber(totals.spells, 0)), 'Всего заклинаний'));
  cards.appendChild(createMetricCard(DASHBOARD_LABELS.content.schools, String(asNumber(totals.schools, 0)), 'Всего школ'));
  cards.appendChild(createMetricCard(DASHBOARD_LABELS.content.concentration, `${asNumber(content.concentrationShare, 0).toFixed(2)}%`, 'Доля концентрации'));
  cards.appendChild(createMetricCard(DASHBOARD_LABELS.content.subspells, `${asNumber(content.subspellShare, 0).toFixed(2)}%`, 'Доля подзаклинаний'));
  cards.appendChild(createMetricCard(DASHBOARD_LABELS.content.incomplete, String(asNumber(content.incompleteObjects, 0)), 'Неполные объекты'));
  cards.appendChild(createMetricCard(DASHBOARD_LABELS.content.schoolsWithoutSpells, String(asNumber(content.schoolsWithoutSpells, 0)), 'Покрытие школ'));

  const rows = safeArray(content.spellsBySchool).slice(0, 12);
  const maxCount = rows.reduce((acc, row) => Math.max(acc, asNumber(row.count, 0)), 0);
  if (!rows.length || maxCount <= 0) {
    bars.innerHTML = '<p class="text-muted">Недостаточно данных для распределения по школам.</p>';
    return;
  }

  rows.forEach((row) => {
    const school = String(row.school || DASHBOARD_LABELS.dice.unknown);
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
  const reportDice = normalizeDiceReport(report.dice);
  const localEvents = loadLocalDiceEvents();
  const localDice = computeDiceFromEvents(localEvents);
  const useLocal = localEvents.length > 0;
  const dice = useLocal ? localDice : reportDice;

  const source = document.getElementById('dice-source');
  const cards = document.getElementById('dice-cards');
  const table = document.getElementById('dice-metrics');
  const rollTypeTable = document.getElementById('dice-roll-type-stats');
  const users = document.getElementById('dice-user-vs-global');
  cards.innerHTML = '';
  table.innerHTML = '';
  rollTypeTable.innerHTML = '';
  users.innerHTML = '';

  source.textContent = useLocal ? DASHBOARD_LABELS.dice.localSource : DASHBOARD_LABELS.dice.reportSource;

  if (String(dice.status || 'insufficient_data') !== 'ok') {
    cards.appendChild(createMetricCard(DASHBOARD_LABELS.dice.status, 'insufficient_data', String(dice.reason || DASHBOARD_LABELS.dice.noData)));
    table.innerHTML = `<tr><td colspan="7" class="no-results">${DASHBOARD_LABELS.dice.noDiceData}</td></tr>`;
    rollTypeTable.innerHTML = `<tr><td colspan="7" class="no-results">${DASHBOARD_LABELS.dice.noRollTypeStats}</td></tr>`;
    users.innerHTML = `<tr><td colspan="3" class="no-results">${DASHBOARD_LABELS.dice.noUserMetrics}</td></tr>`;
    return;
  }

  const countByType = safeObject(dice.rollsCountByDiceType);
  const totalRolls = Object.keys(countByType).reduce((acc, key) => acc + asNumber(countByType[key], 0), 0);
  cards.appendChild(createMetricCard(DASHBOARD_LABELS.dice.totalRolls, String(totalRolls), 'Сумма всех бросков'));
  cards.appendChild(createMetricCard(DASHBOARD_LABELS.dice.activeDice, String(Object.keys(countByType).length), 'Типы кубов с данными'));

  const topRollType = safeObject(dice.topRollType);
  if (topRollType.rollTypeKey) {
    cards.appendChild(
      createMetricCard(
        DASHBOARD_LABELS.dice.topRoll,
        String(topRollType.label || topRollType.rollTypeKey),
        `${DASHBOARD_LABELS.dice.topRollHint}: ${formatPercent(asNumber(topRollType.share, 0))} (${asNumber(topRollType.count, 0)})`
      )
    );
  } else {
    cards.appendChild(createMetricCard(DASHBOARD_LABELS.dice.topRoll, DASHBOARD_LABELS.dice.noData, DASHBOARD_LABELS.dice.noRollTypeStats));
  }

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
  if (!table.children.length) {
    table.innerHTML = `<tr><td colspan="7" class="no-results">${DASHBOARD_LABELS.dice.noDiceData}</td></tr>`;
  }

  const rollTypeRows = safeArray(dice.rollTypeStats).slice(0, 40);
  if (!rollTypeRows.length) {
    rollTypeTable.innerHTML = `<tr><td colspan="7" class="no-results">${DASHBOARD_LABELS.dice.noRollTypeStats}</td></tr>`;
  } else {
    rollTypeRows.forEach((row) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${String(row.label || row.rollTypeKey || DASHBOARD_LABELS.dice.unknown)}</td>
        <td>${String(row.diceType || DASHBOARD_LABELS.dice.unknown)}</td>
        <td>${String(row.expression || '-')}</td>
        <td>${asNumber(row.count, 0)}</td>
        <td>${asNumber(row.avg, 0).toFixed(3)}</td>
        <td>${formatPercent(asNumber(row.critFailRate, 0))}</td>
        <td>${formatPercent(asNumber(row.critSuccessRate, 0))}</td>
      `;
      rollTypeTable.appendChild(tr);
    });
  }

  const userRows = safeArray(dice.userSummaries).slice(0, 50);
  if (!userRows.length) {
    users.innerHTML = `<tr><td colspan="3" class="no-results">${DASHBOARD_LABELS.dice.noUserMetrics}</td></tr>`;
  } else {
    userRows.forEach((row) => {
      const tr = document.createElement('tr');
      tr.className = 'dashboard-user-row';
      tr.title = 'Нажмите для деталей';
      tr.innerHTML = `
        <td>${String(row.userDisplayName || row.userId || DASHBOARD_LABELS.dice.anonymous)}</td>
        <td>${asNumber(row.rollsCount, 0)}</td>
        <td>${formatDateTime(row.lastRollAt)}</td>
      `;
      tr.addEventListener('click', () => openUserStatsModal(row));
      users.appendChild(tr);
    });
  }
}

async function loadReport() {
  const response = await fetch('reports/data_report.json', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Не удалось загрузить отчет (${response.status})`);
  }
  return response.json();
}

async function initDashboard() {
  const status = document.getElementById('dashboard-status');
  setupUserStatsModal();
  try {
    status.textContent = 'Загрузка отчета...';
    const report = await loadReport();
    renderContent(report);
    renderDice(report);
    renderQuality(report);
    status.textContent = `Отчет обновлен: ${new Date(report.generatedAt || Date.now()).toLocaleString('ru-RU')}`;
  } catch (error) {
    status.textContent = `Ошибка загрузки отчета: ${error.message}`;
  }
}

document.addEventListener('DOMContentLoaded', initDashboard);
