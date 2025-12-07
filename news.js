/* E'Magios Core - News / Changelog */

const NEWS_ENTRIES = [
  {
    id: '2025-12-07-fortune-blessing',
    date: '7 декабря 2025',
    title: 'Благословение Фортуны — Обновление E\'Magios Core',
    features: [
      { text: 'Глобальный виджет бросков: плавающая кнопка D12, чат-окно истории бросков и быстрые кнопки D2–D100.' },
      { text: 'Система команд /roll с поддержкой сложных выражений (2d4+3d6-1, 1d12*2/3 и т.п.) и подробной расшифровкой результата.' },
      { text: 'Привязка бросков к заклинаниям: три кнопки (Аркана, Попадание, Наложение эффекта) в поп-апах заклинаний с автоматическим разбором бонусов из описания.' },
      { text: 'Критические броски D12 (значение 12) для проверки Арканы и Броска на Попадание помечаются как КРИТ и визуально подсвечиваются в истории (для Наложения эффекта подсветка отключена).' },
      { text: 'Интеграция с Google/Firebase: история бросков хранится в Firestore на аккаунте и автоматически подгружается после входа.' },
      { text: 'Обновление интерфейса: увеличенные шрифты, кликабельные карточки результатов, улучшенные панели и независимость окна бросков от других поп-апов.' },
      { text: 'База данных заклинаний: новый фильтр «Фирменное Заклинание (Да/Нет)», автоматически определяющий фирменные спеллы по блоку «Бонус Фирменного Заклинания» в описании.' },
      { text: 'База данных: списки «Типы Действий» и «Компоненты Боевой системы» теперь показывают компактное, очищенное от служебных фраз саммари, совпадающее по смыслу с книгами правил.' },
      { text: 'Заклинания в базе и редакторе персонажа: все формулы бросков (2d4, 3d8, 2d4+1 и т.п.) стали кликабельными — при нажатии открывается виджет кубов и автоматически исполняется указанный бросок с пометкой заклинания в истории.' },
      { text: 'Записи в истории бросков теперь всегда содержат исходное выражение: для контекстных бросков (например, «Бросок на попадание (+2) — Огненный Ворон Селены (1d12+2)»), а для свободных бросков — формат «Свободный Бросок — (1d10)».' },
      { text: 'Кнопки бросков в поп-апе заклинаний теперь используют читаемые подписи с бонусом («Бросок на Аркану (+0)», «Бросок на попадание (+2)» и т.п.), чтобы подчёркивать итоговую формулу броска.' }
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
    features: [
      { text: 'Авторизация через Google: вход в систему через Google-аккаунт и подготовка к синхронизации данных профиля' },
      { text: 'Редактор персонажей: отдельное окно создания и управления персонажами на сайте' },
      { text: '50 новых заклинаний в Spellbook и базе данных (группы, комбо, подзаклинания)' },
      { text: 'Новые разделы базы данных: «Навыки», «Типы Действий» и «Боевая система»' },
      { text: 'Работа над внешним видом и удобством: обновлённые поп-апы базы данных, кастомные скроллбары, кликабельные ссылки и улучшенные фильтры' },
      { text: 'Spellbook: повторный перенос и унификация всех заклинаний (новая структура без источника, поддержка мультишкол, подзаклинания и комбо)' },
      { text: 'База данных заклинаний: новые фильтры по типу действия, типу урона, концентрации и требуемому уровню' },
      { text: 'База данных заклинаний: корректная поддержка заклинаний, относящихся сразу к нескольким школам (фильтры и таблицы учитывают все школы)' },
      { text: 'База данных заклинаний: кликабельные школы и типы действий в таблице и карточках заклинаний, открывающие поп-апы без смены раздела' },
      { text: 'База данных: объединены Базовые Действия и Действия Отдыха (19 записей) с фильтром по типу действия' },
      { text: 'Навыки: уровни навыков личности и магии отображаются отдельными подзаголовками внутри описания' },
      { text: 'Типы Действий и Компоненты Боевой системы: в списке — короткое саммари, в карточке — полное описание из книг' },
      { text: 'Архетипы: улучшенное отображение описаний и улучшений, добавлен архетип «Легендарный Ремесленник» и обновлены все 13 архетипов' },
      { text: 'Эффекты: обновлён раздел эффектов (17 эффектов) с корректной разбивкой на абзацы и типы действий' },
      { text: 'Модальные окна базы данных: обновлённый тёмный стиль, кастомные скроллбары и блокировка прокрутки фона при открытии поп-апа' },
      { text: 'Spellbook: тип действия «Автоматон» с оформленным примером пассивного режима как подзаклинания' },
      { text: 'Ритуальные заклинания: отдельный блок «Требования к ритуалу» с временем, участниками и компонентами прямо в карточке заклинания' },
      { text: 'Комбо- и групповые заклинания: подзаклинания сворачиваются/разворачиваются, показывая тип действия и параметры по клику' },
      { text: 'Wikilinks из Obsidian: кликабельные связи между школами, заклинаниями, эффектами, действиями, навыками и боевыми компонентами внутри базы' },
      { text: 'Поп-апы базы и фильтров: выравнивание шапки, ширины и скроллбаров для более компактного и читаемого отображения' }
    ],
    newObjects: {
      spells: 'all',
      schools: [],
      effects: 'all',
      archetypes: ['легендарный-ремесленник'],
      actions: 'all',
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
    features: [
      { text: 'Player\'s Handbook: публикация основных правил для игроков (главы и разделы)' },
      { text: 'Spellbook: публикация школ магии и связанных с ними разделов' },
      { text: 'Master\'s Handbook: базовая структура и первые разделы' },
      { text: 'Craftbook: основные разделы о ремёслах и создании' },
      { text: 'Compendium of Rumors: стартовые материалы и идеи' },
      { text: 'База данных с фильтрами и детальными страницами заклинаний, школ, эффектов, архетипов и действий' },
      { text: 'Защищённые разделы с единым паролем и кнопкой сброса доступа' }
    ],
    newObjects: {
      spells: 'all',
      schools: 'all',
      effects: 'all',
      archetypes: 'all',
      actions: 'all'
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

function renderNews(spells, schools, effects, archetypes, actions, skills, actionTypes, combatComponents, craftComponents, craftProfessions, craftSpecializations, recipeTypes, recipes) {
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

  const totalSkills = skills.length;
  const totalActionTypes = actionTypes.length;
  const totalCombatComponents = combatComponents.length;
  const totalCraftComponents = craftComponents.length;
  const totalCraftProfessions = craftProfessions.length;
  const totalCraftSpecializations = craftSpecializations.length;
  const totalRecipeTypes = recipeTypes.length;
  const totalRecipes = recipes.length;

  const totalObjects =
    totalSpells +
    totalSchools +
    totalEffects +
    totalArchetypes +
    totalActions +
    totalSkills +
    totalActionTypes +
    totalCombatComponents +
    totalCraftComponents +
    totalCraftProfessions +
    totalCraftSpecializations +
    totalRecipeTypes +
    totalRecipes;

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
    }

    let linksHtml = '';
    if (entry.links && entry.links.length) {
      const linksParts = entry.links.map(function (link) {
        return '<a href="' + link.url + '">' + link.text + '</a>';
      });
      linksHtml = '<p class="news-entry-links">См. также: ' + linksParts.join(' · ') + '</p>';
    }

    section.innerHTML =
      '<header class="news-entry-header">' +
      '<h2>' +
      entry.title +
      '</h2>' +
      '<p class="text-muted">' +
      entry.date +
      '</p>' +
      '</header>' +
      '<section class="news-entry-section">' +
      '<h3>Новый функционал на сайте</h3>' +
      '<ul>' +
      featuresHtml +
      '</ul>' +
      linksHtml +
      '</section>' +
      '<section class="news-entry-section">' +
      '<h3>Новые объекты в базе данных</h3>' +
      objectsHtmlParts.join('') +
      '</section>' +
      (entry.id === '2025-11-28-db-update'
        ? '<section class="news-entry-section">' +
          '<h3>Статистика после обновления</h3>' +
          statsHtml +
          '</section>'
        : entry.id === '2025-12-07-fortune-blessing'
        ? '<section class="news-entry-section">' +
          '<h3>Статистика после обновления</h3>' +
          '<p><strong>Всего символов в данных базы:</strong> ' +
          totalChars.toLocaleString('ru-RU') +
          '</p>' +
          '<p><strong>Всего глав (разделов) в книгах:</strong> ' +
          totalChapters +
          '</p>' +
          '<p><strong>Всего объектов в базе данных:</strong> ' +
          totalObjects +
          ' (заклинания: ' +
          totalSpells +
          ', школы: ' +
          totalSchools +
          ', эффекты: ' +
          totalEffects +
          ', архетипы: ' +
          totalArchetypes +
          ', базовые действия: ' +
          totalActions +
          ', навыки: ' +
          totalSkills +
          ', типы действий: ' +
          totalActionTypes +
          ', компоненты боя: ' +
          totalCombatComponents +
          ', ремесленные компоненты: ' +
          totalCraftComponents +
          ', профессии ремесла: ' +
          totalCraftProfessions +
          ', специализации ремесла: ' +
          totalCraftSpecializations +
          ', типы рецептов: ' +
          totalRecipeTypes +
          ', рецепты: ' +
          totalRecipes +
          ')</p>' +
          '</section>'
        : '');

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
      const skills = results[5];
      const actionTypes = results[6];
      const combatComponents = results[7];
      const craftComponents = results[8];
      const craftProfessions = results[9];
      const craftSpecializations = results[10];
      const recipeTypes = results[11];
      const recipes = results[12];

      renderNews(
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
      );
    })
    .catch(function () {
      const container = document.getElementById('news-list');
      if (container) {
        container.innerHTML = '<p class="text-muted">Не удалось загрузить данные для списка изменений.</p>';
      }
    });
});


