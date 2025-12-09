/* E'Magios Core - News / Changelog */

import { BOOKS } from './books.js?v=579174ea';

const NEWS_ENTRIES = [
  {
    id: '2025-12-08-alfred-gift',
    date: '9 декабря 2025',
    title: 'Подарок от Альфреда — Обновление E\'Magios Core',
    brief: 'Улучшенные броски - Интеграция с Discord - Экран Загрузки - Лобби (BETA)',
    features: [
      { text: 'Добавлено приглашение гостю войти через Google; профиль и поля Discord теперь скрыты до авторизации.' },
      { text: 'Добавлена фиксированная панель внизу профиля с кнопками: Сохранить, Сбросить изменения, Выйти (с подтверждением).' },
      { text: 'Добавлено дублирование бросков в Discord через сохранённый вебхук (URL, имя и цвет хранятся в профиле).' },
      { text: 'Улучшен выбор цвета сообщений: палитра со свотчами и живым превью на базе оттенков #10B981.' },
      { text: 'Добавлена автокнопка «Наверх» на всех страницах.' },
      { text: 'Добавлена кнопка «Очистить историю» в виджете кубов: очищает локальные броски и, при авторизации, последние сохранённые броски в профиле.' },
      { text: 'Улучшен парсинг многоуровневых эффектов (Слепота, Скрытый, Подавление Магии): все уровни отображаются как раскрывающиеся подэффекты в базе данных.' },
      { text: 'Изменено оформление категорий базы: три строки с общим фоном для блоков «основы системы», «магия» и «ремесло», служебный текст над вкладками убран.' },
      { text: 'Добавлен единый экран загрузки для профиля, редактора и лобби — убирает вспышки авторизации и подготавливает данные перед показом.' },
      { text: 'Добавлены первые онлайн-лобби (BETA): список комнат, вход по ссылке или коду, чат и общий холст.' },
      { text: 'Упрощена поддержка базы: таблицы и попапы читают единую схему колонок и фильтров из schema.js?v=5a2b271e, правки делаются в одном месте.' }
    ],
    newObjects: {
      spells: [],
      schools: [],
      effects: [],
      archetypes: [],
      actions: [],
      basics: [],
      skills: [],
      actionTypes: [],
      combatComponents: [],
      craftComponents: [],
      craftProfessions: [],
      craftSpecializations: [],
      recipeTypes: [],
      recipes: []
    },
    links: [
      { text: 'Профиль', url: 'profile.html' }
    ]
  },
  {
    id: '2025-12-07-fortune-blessing',
    date: '7 декабря 2025',
    title: 'Благословение Фортуны — Обновление E\'Magios Core',
    brief: 'Виджет кубов - Формулы бросков - Кликабельные формулы - Фильтры БД - Новые заклинания',
    features: [
      { text: 'Добавлен плавающий виджет кубов: кнопка D12, история бросков и быстрые броски D2–D100.' },
      { text: 'Расширена команда /roll: поддерживает сложные формулы (2d4+3d6-1, 1d12*2/3) и показывает расшифровку.' },
      { text: 'Добавлены авто-кнопки в поп-апах заклинаний (Аркана, Попадание, Наложение) — сразу подставляют бонусы из описания.' },
      { text: 'Добавлена подсветка критов D12 для Арканы и Попадания; история бросков синхронизируется через Google/Firebase.' },
      { text: 'Улучшен интерфейс кубов: крупнее элементы, кликабельные результаты, окно не блокирует другие поп-апы.' },
      { text: 'Добавлен фильтр «Фирменное Заклинание (Да/Нет)» в базе заклинаний с автоопределением.' },
      { text: 'Сделаны кликабельными формулы бросков в базе и редакторе: открывают виджет, сразу выполняют бросок и сохраняют исходное выражение.' },
      { text: 'Добавлено саммари в таблицы «Типы действий» и «Компоненты боя»; кнопки бросков используют понятные подписи с бонусом.' }
    ],
    newObjects: {
      // Новые заклинания после "Кузни Героев" (ядовитая ветка и фирменное заклинание Селены)
      spells: [
        'антидот',
        'двойственный-яд',
        'иглы-стойкости',
        'лечебные-галлюцинации',
        'модернизация-автоматонов-дагнилифа',
        'нестабильный-заряд-элая',
        'огненный-ворон-селены',
        'передвижной-факел',
        'спасительный-яд',
        'яд-берсерка'
      ],
      schools: [],
      // Новый эффект состояния
      effects: ['близок-к-смерти'],
      archetypes: [],
      // Новое базовое действие
      actions: ['стабилизация'],
      basics: [],
      skills: [],
      actionTypes: [],
      combatComponents: [],
      // Новые ремесленные сущности целиком
      craftComponents: 'all',
      craftProfessions: 'all',
      craftSpecializations: 'all',
      recipeTypes: 'all',
      recipes: 'all'
    },
    links: [
      { text: 'База данных — заклинания', url: 'db.html?openTab=spells' }
    ]
  },
  {
    id: '2025-11-28-db-update',
    date: '28 ноября 2025',
    title: 'Кузня Героев — Обновление E\'Magios Core',
    brief: 'Авторизация - Редактор Персонажа - Новые Заклинания - Новые разделы БД',
    features: [
      { text: 'Добавлен вход через Google — профили готовы к синхронизации.' },
      { text: 'Добавлен новый редактор персонажей в отдельном окне.' },
      { text: 'Добавлено 50+ заклинаний в Spellbook и базу, включая группы, комбо и подзаклинания.' },
      { text: 'Добавлены новые разделы базы: Навыки, Типы действий, Боевая система; базовые и отдых-действия объединены (19 записей).' },
      { text: 'Расширены фильтры заклинаний: тип действия, урон, концентрация, требуемый уровень; поддерживаются заклинания с несколькими школами.' },
      { text: 'Улучшены карточки заклинаний: кликабельные школы и типы действий, сворачиваемые подзаклинания, блок требований для ритуалов.' },
      { text: 'Обновлены архетипы (добавлен «Легендарный Ремесленник») и эффекты (17) с оформленными описаниями.' },
      { text: 'Обновлены поп-апы базы и фильтров: тёмный стиль, кастомные скроллбары, аккуратная шапка.' }
    ],
    newObjects: {
      spells: 'all',
      schools: [],
      effects: 'all',
      archetypes: ['легендарный-ремесленник'],
      actions: 'all',
      basics: [
        'abstract-categories',
        'archetypes',
        'actions',
        'intro',
        'long-term-projects',
        'combat',
        'critical-success',
        'metamagic',
        'leveling',
        'wounds',
        'rituals',
        'creation',
        'spontaneous-spells',
        'study-spells',
        'signature-spells',
        'stats',
        'equipment',
        'effects'
      ],
      skills: ['атлетика', 'восприятие', 'знания', 'контакты', 'общение', 'конструирование', 'метамагия', 'ритуалогия', 'созидание', 'спонтанность'],
      actionTypes: ['автоматон', 'атака', 'группа-заклинаний', 'защита', 'комбо', 'контроль', 'магическое-приспособление', 'небоевое', 'пассивно', 'поддержка', 'призыв-объекта', 'ритуал'],
      combatComponents: ['аркана', 'атакующие-действия', 'бонус-к-наложению', 'бонус-к-попаданию', 'воля', 'действия-в-ходу', 'защита', 'здоровье', 'концентрация', 'правило-наибольшего-значения', 'реакции', 'сопротивление', 'спасбросок', 'стойкость', 'уклонение', 'уровень', 'уровни-повреждений', 'уязвимость']
    },
    links: [
      { text: 'База данных — вкладка «Навыки»', url: 'db.html?openTab=skills' },
      { text: 'База данных — вкладка «Типы Действий»', url: 'db.html?openTab=action-types' },
      { text: 'База данных — вкладка «Боевая система»', url: 'db.html?openTab=combat' }
    ]
  },
  {
    id: '2025-11-27-initial',
    date: '27 ноября 2025',
    title: 'Первородный — Первая версия сайта E\'Magios Core',
    brief: 'Запуск: книги правил, база данных, редактор персонажей, парольная защита',
    features: [
      { text: 'Запущены Player\'s Handbook, Spellbook, Master\'s Handbook, Craftbook и Compendium of Rumors на сайте с оглавлением и якорями.' },
      { text: 'Добавлена база данных с фильтрами и карточками заклинаний, школ, эффектов, архетипов и действий.' },
      { text: 'Добавлен редактор персонажей: считает характеристики по уровню, сохраняет несколько профилей, экспортирует в JSON.' },
      { text: 'Добавлена защита закрытых разделов единым паролем и кнопкой сброса доступа.' }
    ],
    newObjects: {
      spells: 'all',
      schools: 'all',
      effects: 'all',
      archetypes: 'all',
      actions: 'all',
      basics: 'all'
    },
    links: [
      { text: 'Player\'s Handbook', url: 'phb.html' },
      { text: 'Spellbook', url: 'spellbook.html' },
      { text: 'База данных', url: 'db.html' },
      { text: 'Редактор персонажей', url: 'character-editor.html' }
    ]
  }
];

// Список заклинаний и эффектов, которые уже были на продакшене
// (используются для отделения старого контента от нового)
const INITIAL_SPELL_NAMES = [
  'Аркановое Оружие',
  'Аркановый Залп',
  'Аркановый Разрез',
  'Благословение Быка',
  'Благословенный Ветрами',
  'Взрыв Арканы',
  'Взрыв Разума',
  'Водяной Щит',
  'Водяные Иглы',
  'Воздушный Кулак',
  'Волна',
  'Выстрел Арканы',
  'Генератор Щита',
  'Головокружение',
  'Двойная Вспышка',
  'Защита Разума',
  'Земляная Защита',
  'Земляная Тюрьма',
  'Мгновенный Шаг',
  'Метка Пламени',
  'Облако Яда',
  'Огненный Шар',
  'Огненный Щит',
  'Перенаправление Снаряда',
  'Поджег',
  'Приказ',
  'Рой Насекомых',
  'Сверхлегкий Клинок [+4]',
  'Слабовольность',
  'Смена Приспособления',
  'Смертельная Игла',
  'Сонный Паралич',
  'Стремительный Рывок',
  'Твердыня',
  'Терновая клетка',
  'Тошнотворный Цветок',
  'Трех-контурное Наступательное Усиление [+3]',
  'Трехзарядный Магический Револьвер [+4]',
  'Тяжелая Энергетическая Броня',
  'Удар Парящего Змея',
  'Управление Скалой',
  'Усиленный Удар',
  'Ускорение',
  'Целительная Вода',
  'Цепи Арканы',
  'Цепь Молний',
  'Чувство Земли',
  'Щит Арканы',
  'Электрическая Перегрузка',
  'Яд-Поглотитель',
  'Ядовитая Аура',
  'Язык Лягушки'
];

const INITIAL_EFFECT_NAMES = [
  'В укрытии',
  'Замедление',
  'Невидимость',
  'Немота',
  'Обездвиженность',
  'Оглушение',
  'Ослепление',
  'Подавление Магии',
  'Сбитый с ног',
  'Скованность',
  'Сон',
  'Тошнота'
];

// Фиксированный список «Основ системы» для обновления базы от 28.11.2025,
// чтобы не зависеть от будущих изменений basics.json
const DB_UPDATE_BASIC_IDS = [
  'abstract-categories',
  'archetypes',
  'actions',
  'intro',
  'long-term-projects',
  'combat',
  'critical-success',
  'metamagic',
  'leveling',
  'wounds',
  'rituals',
  'creation',
  'spontaneous-spells',
  'study-spells',
  'signature-spells',
  'stats',
  'equipment',
  'effects'
];

// Зафиксированная статистика (контент + БД) на момент последних обновлений
const LATEST_STATS_SNAPSHOT = {
  totalContentChars: 207093,
  totalChapters: 38,
  totalObjects: 290,
  counts: {
    spells: 113,
    schools: 38,
    effects: 18,
    archetypes: 13,
    actions: 22,
    skills: 10,
    actionTypes: 13,
    combatComponents: 21,
    craftComponents: 11,
    craftProfessions: 6,
    craftSpecializations: 21,
    recipeTypes: 3,
    recipes: 1
  }
};

// Фиксированные списки объектов для новости "Кузня Героев — Обновление E'Magios Core"
// чтобы они совпадали с продакшн-версией HTML на 28 ноября 2025
const DB_UPDATE_SPELL_NAMES = [
  'Блуждающий Разум',
  'Великое Обнаружение Магии',
  'Великое Подводное Дыхание',
  'Взрывные Грибы',
  'Вихрь из Меток Пламени',
  'Влюбленность',
  'Водяная Клетка',
  'Возведение Земли',
  'Всполох Мести',
  'Генератор Щита МК1',
  'Глаз Бури',
  'Глаз-Разведчик МК1',
  'Животные Чувства',
  'Жнец МК1',
  'Защита Территории',
  'Защитник МК1',
  'Изучение крови',
  'Источник Огня',
  'Коррозийная Стрела',
  'Магический Слуга',
  'Обнаружение Магии',
  'Обнаружение Ядов',
  'Общение Воспоминаниями',
  'Огненная Бомба',
  'Огненная Вспышка',
  'Огненная Кара',
  'Огненная Стена',
  'Передача образа',
  'Поглощение Стихии',
  'Подводное Дыхание',
  'Поиск Следов',
  'Поиск животных и растений',
  'Призыв Землетрясения',
  'Призыв Торнадо',
  'Призыв Цунами',
  'Призыв воды',
  'Пробуждение вулкана',
  'Противоядие',
  'Психический Щит',
  'Путешествие в Воспоминание',
  'Разговор с Животными',
  'Разрушение в Защиту',
  'Робот-Рука МК1',
  'Сбивающий яд',
  'Сверхлегкий Клинок М1',
  'Слепая Ярость',
  'Слияние с Природой',
  'Смертельный Сон',
  'Телепатическая Связь',
  'Трех-контурное Наступательное Усиление',
  'Трехзарядный Магический Револьвер М1',
  'Универсальный Протез Руки М1',
  'Устройства Связи',
  'Усыпляющий Дождь',
  'Хождение по Воде',
  'Энергетическая Броня МК1'
];

const DB_UPDATE_ACTION_NAMES = [
  'Вспомнить Информацию',
  'Длительный отдых',
  'Заклинания',
  'Исследование',
  'Концентрация',
  'Короткий отдых',
  'Лечение ран',
  'Медитация',
  'Оборона',
  'Передвижение',
  'Поиск Слабого Места',
  'Починка',
  'Преодоление',
  'Создание',
  'Создание Метамагии',
  'Создание Спотнанного Заклинания',
  'Спасбросок',
  'Удар',
  'Фокус'
];

const DB_UPDATE_COMBAT_COMPONENT_NAMES = [
  'Аркана',
  'Атакующие действия',
  'Бонус к Наложению',
  'Бонус к Попаданию',
  'Воля',
  'Действия в ходу',
  'Защита',
  'Здоровье',
  'Концентрация',
  'Правило Наибольшего Значения',
  'Реакции',
  'Сопротивление',
  'Спасбросок',
  'Стойкость',
  'Уклонение',
  'Уровень',
  'Уровни Повреждений',
  'Уязвимость'
];

function loadJSON(path) {
  return fetch(path, { cache: 'no-store' }).then(function (response) {
    return response.json();
  });
}

function formatObjectsList(items, type) {
  if (items.length === 0) {
    return '<span>—</span>';
  }

  const parts = items.map(function (item) {
    if (type === 'spell') {
      return '<a href="db.html?spell=' + encodeURIComponent(item.id) + '">' + item.name + '</a>';
    }
    if (type === 'school') {
      return '<a href="db.html?school=' + encodeURIComponent(item.id) + '">' + item.name + '</a>';
    }
    if (type === 'effect') {
      return '<a href="db.html?effect=' + encodeURIComponent(item.id) + '">' + item.name + '</a>';
    }
    if (type === 'archetype') {
      return '<a href="db.html?archetype=' + encodeURIComponent(item.id) + '">' + item.name + '</a>';
    }
    if (type === 'action') {
      return '<a href="db.html?action=' + encodeURIComponent(item.id) + '">' + item.name + '</a>';
    }
    if (type === 'basic') {
      return '<a href="db.html?basic=' + encodeURIComponent(item.id) + '">' + item.name + '</a>';
    }
    if (type === 'skill') {
      return '<a href="db.html#skills-tab" onclick="event.preventDefault(); window.location.href = \'db.html?openTab=skills\';">' + item.name + '</a>';
    }
    if (type === 'actionType') {
      return '<a href="db.html#action-types-tab" onclick="event.preventDefault(); window.location.href = \'db.html?openTab=action-types\';">' + item.name + '</a>';
    }
    if (type === 'combatComponent') {
      return '<a href="db.html#combat-tab" onclick="event.preventDefault(); window.location.href = \'db.html?openTab=combat\';">' + item.name + '</a>';
    }
    if (type === 'craftComponent') {
      return '<a href="db.html?craftComponent=' + encodeURIComponent(item.id) + '">' + item.name + '</a>';
    }
    if (type === 'craftProfession') {
      return '<a href="db.html?craftProfession=' + encodeURIComponent(item.id) + '">' + item.name + '</a>';
    }
    if (type === 'craftSpecialization') {
      return '<a href="db.html?craftSpecialization=' + encodeURIComponent(item.id) + '">' + item.name + '</a>';
    }
    if (type === 'recipeType') {
      return '<a href="db.html?recipeType=' + encodeURIComponent(item.id) + '">' + item.name + '</a>';
    }
    if (type === 'recipe') {
      return '<a href="db.html?recipe=' + encodeURIComponent(item.id) + '">' + item.name + '</a>';
    }
    return item.name;
  });

  return parts.join(', ');
}

function countTextLengthFromCollections(collections) {
  let total = 0;
  collections.forEach(function (list) {
    list.forEach(function (item) {
      Object.keys(item).forEach(function (key) {
        const value = item[key];
        if (typeof value === 'string') {
          total += value.length;
        } else if (Array.isArray(value)) {
          value.forEach(function (sub) {
            if (typeof sub === 'string') {
              total += sub.length;
            } else if (sub && typeof sub === 'object') {
              Object.keys(sub).forEach(function (subKey) {
                const subValue = sub[subKey];
                if (typeof subValue === 'string') {
                  total += subValue.length;
                }
              });
            }
          });
        }
      });
    });
  });
  return total;
}

function calculateTotalChapters() {
  let total = 0;
  Object.keys(BOOKS).forEach(function (bookKey) {
    const book = BOOKS[bookKey];
    if (book && Array.isArray(book.chapters)) {
      total += book.chapters.length;
    }
  });
  return total;
}

function renderNews(spells, schools, effects, archetypes, actions, basics, skills, actionTypes, combatComponents, craftComponents, craftProfessions, craftSpecializations, recipeTypes, recipes) {
  const container = document.getElementById('news-list');
  if (!container) {
    return;
  }

  container.innerHTML = '';

  const totalSpells = spells.length;
  const totalSchools = schools.length;
  const totalEffects = effects.length;
  const totalArchetypes = archetypes.length;
  const totalActions = actions.length;
  const totalBasics = basics.length;

  const totalSkills = skills.length;
  const totalActionTypes = actionTypes.length;
  const totalCombatComponents = combatComponents.length;
  const totalCraftComponents = craftComponents.length;
  const totalCraftProfessions = craftProfessions.length;
  const totalCraftSpecializations = craftSpecializations.length;
  const totalRecipeTypes = recipeTypes.length;
  const totalRecipes = recipes.length;

  const totalChars = countTextLengthFromCollections([
    spells,
    schools,
    effects,
    archetypes,
    actions,
    skills,
    actionTypes,
    combatComponents,
    craftComponents,
    craftProfessions,
    craftSpecializations,
    recipeTypes,
    recipes
  ]);

  const totalObjects =
    totalSpells +
    totalSchools +
    totalEffects +
    totalArchetypes +
    totalActions +
    totalBasics +
    totalSkills +
    totalActionTypes +
    totalCombatComponents +
    totalCraftComponents +
    totalCraftProfessions +
    totalCraftSpecializations +
    totalRecipeTypes +
    totalRecipes;

  // Контент (книги + БД)
  const totalContentChars = totalChars;

  // Приблизительная оценка объёма кода сайта (HTML/CSS/JS) — базовое значение + контент.
  const BASE_CODE_CHARS = 120000;
  const totalCodeChars = BASE_CODE_CHARS + totalContentChars;
  const totalChapters = calculateTotalChapters();

  NEWS_ENTRIES.forEach(function (entry) {
    const section = document.createElement('article');
    section.className = 'news-entry';

    // Заклинания: для стартового и обновления от 28.11 используем фиксированные списки имён,
    // чтобы разделить "старые" и "новые" объекты строго по продакшн-снимку
    let newSpells;
    if (entry.id === '2025-11-27-initial') {
      newSpells = spells.filter(function (spell) {
        return INITIAL_SPELL_NAMES.indexOf(spell.name) !== -1;
      });
    } else if (entry.id === '2025-11-28-db-update') {
      newSpells = DB_UPDATE_SPELL_NAMES.map(function (name) {
        return spells.find(function (s) {
          return s.name === name;
        });
      }).filter(Boolean);
    } else if (entry.newObjects.spells === 'all') {
      newSpells = spells;
    } else {
      newSpells = (entry.newObjects.spells || []).map(function (id) {
        return spells.find(function (s) { return s.id === id; });
      }).filter(Boolean);
    }

    const newSchools = entry.newObjects.schools === 'all' ? schools : schools.filter(function (school) {
      return entry.newObjects.schools.indexOf(school.id) !== -1;
    });

    // Эффекты: аналогично делим на старые (стартовый набор) и новые
    let newEffects;
    if (entry.id === '2025-11-27-initial') {
      newEffects = effects.filter(function (effect) {
        return INITIAL_EFFECT_NAMES.indexOf(effect.name) !== -1;
      });
    } else if (entry.id === '2025-11-28-db-update') {
      newEffects = effects.filter(function (effect) {
        return INITIAL_EFFECT_NAMES.indexOf(effect.name) === -1;
      });
    } else if (entry.newObjects.effects === 'all') {
      newEffects = effects;
    } else {
      newEffects = (entry.newObjects.effects || []).map(function (id) {
        return effects.find(function (e) { return e.id === id; });
      }).filter(Boolean);
    }

    const newArchetypes = entry.newObjects.archetypes === 'all' ? archetypes : archetypes.filter(function (archetype) {
      return entry.newObjects.archetypes.indexOf(archetype.id) !== -1;
    });

    let newActions;
    if (entry.id === '2025-11-28-db-update') {
      newActions = DB_UPDATE_ACTION_NAMES.map(function (name) {
        return actions.find(function (a) {
          return a.name === name;
        });
      }).filter(Boolean);
    } else if (entry.newObjects.actions === 'all') {
      newActions = actions;
    } else {
      newActions = actions.filter(function (action) {
        return (entry.newObjects.actions || []).indexOf(action.id) !== -1;
      });
    }

    const newBasics =
      entry.newObjects.basics === 'all'
        ? basics
        : (entry.newObjects.basics || []).map(function (id) {
            return basics.find(function (b) { return b.id === id; });
          }).filter(Boolean);

    const newSkills = entry.newObjects.skills === 'all' ? skills : (entry.newObjects.skills || []).map(function (id) {
      return skills.find(function (s) { return s.id === id; });
    }).filter(Boolean);

    const newActionTypes = entry.newObjects.actionTypes === 'all' ? actionTypes : (entry.newObjects.actionTypes || []).map(function (id) {
      return actionTypes.find(function (t) { return t.id === id; });
    }).filter(Boolean);

    let newCombatComponents;
    if (entry.id === '2025-11-28-db-update') {
      newCombatComponents = DB_UPDATE_COMBAT_COMPONENT_NAMES.map(function (name) {
        return combatComponents.find(function (c) {
          return c.name === name;
        });
      }).filter(Boolean);
    } else if (entry.newObjects.combatComponents === 'all') {
      newCombatComponents = combatComponents;
    } else {
      newCombatComponents = (entry.newObjects.combatComponents || [])
        .map(function (id) {
          return combatComponents.find(function (c) {
            return c.id === id;
          });
        })
        .filter(Boolean);
    }

    const newCraftComponents =
      entry.newObjects.craftComponents === 'all'
        ? craftComponents
        : (entry.newObjects.craftComponents || [])
            .map(function (id) {
              return craftComponents.find(function (c) {
                return c.id === id;
              });
            })
            .filter(Boolean);

    const newCraftProfessions =
      entry.newObjects.craftProfessions === 'all'
        ? craftProfessions
        : (entry.newObjects.craftProfessions || [])
            .map(function (id) {
              return craftProfessions.find(function (p) {
                return p.id === id;
              });
            })
            .filter(Boolean);

    const newCraftSpecializations =
      entry.newObjects.craftSpecializations === 'all'
        ? craftSpecializations
        : (entry.newObjects.craftSpecializations || [])
            .map(function (id) {
              return craftSpecializations.find(function (s) {
                return s.id === id;
              });
            })
            .filter(Boolean);

    const newRecipeTypes =
      entry.newObjects.recipeTypes === 'all'
        ? recipeTypes
        : (entry.newObjects.recipeTypes || [])
            .map(function (id) {
              return recipeTypes.find(function (t) {
                return t.id === id;
              });
            })
            .filter(Boolean);

    const newRecipes =
      entry.newObjects.recipes === 'all'
        ? recipes
        : (entry.newObjects.recipes || [])
            .map(function (id) {
              return recipes.find(function (r) {
                return r.id === id;
              });
            })
            .filter(Boolean);

    const featuresHtml = entry.features.map(function (feature) {
      return '<li>' + feature.text + '</li>';
    }).join('');

    const objectsHtmlParts = [];

    objectsHtmlParts.push('<p><strong>Новые заклинания:</strong> ' + formatObjectsList(newSpells, 'spell') + '</p>');
    objectsHtmlParts.push('<p><strong>Новые школы:</strong> ' + formatObjectsList(newSchools, 'school') + '</p>');
    objectsHtmlParts.push('<p><strong>Новые эффекты:</strong> ' + formatObjectsList(newEffects, 'effect') + '</p>');
    objectsHtmlParts.push('<p><strong>Новые архетипы:</strong> ' + formatObjectsList(newArchetypes, 'archetype') + '</p>');
    objectsHtmlParts.push('<p><strong>Новые базовые действия:</strong> ' + formatObjectsList(newActions, 'action') + '</p>');
    objectsHtmlParts.push('<p><strong>Новые основы системы:</strong> ' + formatObjectsList(newBasics, 'basic') + '</p>');
    objectsHtmlParts.push('<p><strong>Новые навыки:</strong> ' + formatObjectsList(newSkills, 'skill') + '</p>');
    objectsHtmlParts.push('<p><strong>Новые типы действий:</strong> ' + formatObjectsList(newActionTypes, 'actionType') + '</p>');
    objectsHtmlParts.push(
      '<p><strong>Новые компоненты боевой системы:</strong> ' +
        formatObjectsList(newCombatComponents, 'combatComponent') +
        '</p>'
    );

    if (entry.id === '2025-12-07-fortune-blessing') {
      objectsHtmlParts.push(
        '<p><strong>Новые ремесленные компоненты:</strong> ' +
          formatObjectsList(newCraftComponents, 'craftComponent') +
          '</p>'
      );
      objectsHtmlParts.push(
        '<p><strong>Новые профессии ремесла:</strong> ' +
          formatObjectsList(newCraftProfessions, 'craftProfession') +
          '</p>'
      );
      objectsHtmlParts.push(
        '<p><strong>Новые специализации ремесла:</strong> ' +
          formatObjectsList(newCraftSpecializations, 'craftSpecialization') +
          '</p>'
      );
      objectsHtmlParts.push(
        '<p><strong>Новые типы рецептов:</strong> ' +
          formatObjectsList(newRecipeTypes, 'recipeType') +
          '</p>'
      );
      objectsHtmlParts.push(
        '<p><strong>Новые рецепты:</strong> ' + formatObjectsList(newRecipes, 'recipe') + '</p>'
      );
    }

    let statsHtml = '';
    if (entry.id === '2025-11-28-db-update') {
      // Фиксированные значения для этого обновления, чтобы не менять их при будущем росте базы
      statsHtml = [
        '<p><strong>Всего символов в данных базы:</strong> 140\u00a0477</p>',
        '<p><strong>Всего глав (разделов) в книгах:</strong> 39</p>',
        '<p><strong>Всего объектов в базе данных:</strong> 230 (заклинания: 103, школы: 38, эффекты: 17, архетипы: 13, базовые действия: 19, навыки: 10, типы действий: 12, компоненты боя: 18)</p>'
      ].join('');
    } else if (entry.id === '2025-12-07-fortune-blessing' || entry.id === '2025-12-08-alfred-gift') {
      // Статистика зафиксирована константой, чтобы не зависеть от будущего роста базы
      const s = LATEST_STATS_SNAPSHOT;
      const c = s.counts;
      statsHtml =
        '<p><strong>Всего символов в контенте (Книги, БД):</strong> ' +
        s.totalContentChars.toLocaleString('ru-RU') +
        '</p>' +
        '<p><strong>Всего глав (разделов) в книгах:</strong> ' +
        s.totalChapters +
        '</p>' +
        '<p><strong>Всего объектов в базе данных:</strong> ' +
        s.totalObjects +
        ' (заклинания: ' +
        c.spells +
        ', школы: ' +
        c.schools +
        ', эффекты: ' +
        c.effects +
        ', архетипы: ' +
        c.archetypes +
        ', базовые действия: ' +
        c.actions +
        ', основы системы: ' +
        basics.length +
        ', навыки: ' +
        c.skills +
        ', типы действий: ' +
        c.actionTypes +
        ', компоненты боя: ' +
        c.combatComponents +
        ', ремесленные компоненты: ' +
        c.craftComponents +
        ', профессии ремесла: ' +
        c.craftProfessions +
        ', специализации ремесла: ' +
        c.craftSpecializations +
        ', типы рецептов: ' +
        c.recipeTypes +
        ', рецепты: ' +
        c.recipes +
        ')</p>';
    }

    let linksHtml = '';
    if (entry.links && entry.links.length) {
      const linksParts = entry.links.map(function (link) {
        return '<a href="' + link.url + '">' + link.text + '</a>';
      });
      linksHtml = '<p class="news-entry-links">См. также: ' + linksParts.join(' · ') + '</p>';
    }

    const isLatest = entry.id === NEWS_ENTRIES[0].id;
    const openAttr = isLatest ? ' open' : '';

    const briefHtml = entry.brief
      ? '<div class="news-entry-brief">' + entry.brief + '</div>'
      : '';

    section.innerHTML =
      '<details class="news-entry-details"' +
      openAttr +
      '>' +
      '<summary class="news-entry-summary">' +
      '<div class="news-summary-top">' +
      '<span class="news-entry-title">' +
      entry.title +
      '</span>' +
      '<span class="news-entry-date">' +
      entry.date +
      '</span>' +
      '<span class="news-entry-toggle">▾</span>' +
      '</div>' +
      briefHtml +
      '</summary>' +
      '<div class="news-entry-body">' +
      '<section class="news-entry-section news-section-features">' +
      '<details open>' +
      '<summary class="news-section-summary"><span>Новый функционал на сайте</span></summary>' +
      '<ul>' +
      featuresHtml +
      '</ul>' +
      linksHtml +
      '</details>' +
      '</section>' +
      '<section class="news-entry-section news-section-objects">' +
      '<details open>' +
      '<summary class="news-section-summary"><span>Новые объекты в базе данных</span></summary>' +
      objectsHtmlParts.join('') +
      '</details>' +
      '</section>' +
      (statsHtml
        ? '<section class="news-entry-section news-section-stats">' +
          '<details>' +
          '<summary class="news-section-summary"><span>Статистика после обновления</span></summary>' +
          statsHtml +
          '</details>' +
          '</section>'
        : '') +
      '</div>' +
      '</details>';

    container.appendChild(section);
  });
}

document.addEventListener('DOMContentLoaded', function () {
  Promise.all([
    loadJSON('./data/spells.json'),
    loadJSON('./data/schools.json'),
    loadJSON('./data/effects.json'),
    loadJSON('./data/archetypes.json'),
    loadJSON('./data/actions.json'),
    loadJSON('./data/basics.json'),
    loadJSON('./data/skills.json'),
    loadJSON('./data/action_types.json'),
    loadJSON('./data/combat_components.json'),
    loadJSON('./data/craft_components.json'),
    loadJSON('./data/craft_professions.json'),
    loadJSON('./data/craft_specializations.json'),
    loadJSON('./data/recipe_types.json'),
    loadJSON('./data/recipes.json')
  ])
    .then(function (results) {
      const spells = results[0];
      const schools = results[1];
      const effects = results[2];
      const archetypes = results[3];
      const actions = results[4];
      const basics = results[5];
      const skills = results[6];
      const actionTypes = results[7];
      const combatComponents = results[8];
      const craftComponents = results[9];
      const craftProfessions = results[10];
      const craftSpecializations = results[11];
      const recipeTypes = results[12];
      const recipes = results[13];

      renderNews(
        spells,
        schools,
        effects,
        archetypes,
        actions,
        basics,
        skills,
        actionTypes,
        combatComponents,
        craftComponents,
        craftProfessions,
        craftSpecializations,
        recipeTypes,
        recipes
      );
    })
    .catch(function () {
      const container = document.getElementById('news-list');
      if (container) {
        container.innerHTML = '<p class="text-muted">Не удалось загрузить данные для списка изменений.</p>';
      }
    });
});


