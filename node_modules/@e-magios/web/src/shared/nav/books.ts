export interface BookChapter {
  id: string;
  title: string;
  file: string;
}

export interface Book {
  title: string;
  locked: boolean;
  chapters: BookChapter[];
}

export const BOOKS: Record<string, Book> = {
  phb: {
    title: "Player's Handbook",
    locked: true,
    chapters: [
      { id: 'intro', title: 'Введение', file: 'phb/intro.html' },
      { id: 'creation', title: 'Создание Персонажа', file: 'phb/creation.html' },
      { id: 'stats', title: 'Характеристики', file: 'phb/stats.html' },
      { id: 'study-spells', title: 'Учебные Заклинания', file: 'phb/study-spells.html' },
      { id: 'signature-spells', title: 'Фирменные Заклинания', file: 'phb/signature-spells.html' },
      { id: 'spontaneous-spells', title: 'Спонтанные Заклинания', file: 'phb/spontaneous-spells.html' },
      { id: 'metamagic', title: 'Метамагия', file: 'phb/metamagic.html' },
      { id: 'abstract-categories', title: 'Абстрактные Категории', file: 'phb/abstract-categories.html' },
      { id: 'rituals', title: 'Ритуалы', file: 'phb/rituals.html' },
      { id: 'combat', title: 'Компоненты Боевой Системы', file: 'phb/combat.html' },
      { id: 'actions', title: 'Базовые Действия', file: 'phb/actions.html' },
      { id: 'critical-success', title: 'Критический Успех', file: 'phb/critical-success.html' },
      { id: 'wounds', title: 'Раны', file: 'phb/wounds.html' },
      { id: 'archetypes', title: 'Архетипы', file: 'phb/archetypes.html' },
      { id: 'leveling', title: 'Повышение Уровня', file: 'phb/leveling.html' },
      { id: 'long-term-projects', title: 'Долгосрочные Проекты', file: 'phb/long-term-projects.html' },
      { id: 'equipment', title: 'Экипировка', file: 'phb/equipment.html' },
      { id: 'crafting', title: 'Ремесло', file: 'phb/crafting.html' },
      { id: 'effects', title: 'Эффекты', file: 'phb/effects.html' },
    ],
  },
  spellbook: {
    title: 'Spellbook',
    locked: true,
    chapters: [
      { id: 'intro', title: 'Введение', file: 'spellbook/intro.html' },
      { id: 'schools', title: 'Школы Магии', file: 'spellbook/schools.html' },
      { id: 'typology', title: 'Типология Магии', file: 'spellbook/typology.html' },
      { id: 'study-spells', title: 'Учебные заклинания', file: 'spellbook/study-spells.html' },
      { id: 'signature-spells', title: 'Фирменные заклинания', file: 'spellbook/signature-spells.html' },
      { id: 'spell-creation', title: 'Создание Заклинания', file: 'spellbook/spell-creation.html' },
      { id: 'spontaneous-spells', title: 'Спонтанные заклинания', file: 'spellbook/spontaneous-spells.html' },
      { id: 'metamagic', title: 'Метамагия', file: 'spellbook/metamagic.html' },
    ],
  },
  master: {
    title: "Master's Handbook",
    locked: true,
    chapters: [
      { id: 'intro', title: 'Введение', file: 'master/intro.html' },
      { id: 'genre', title: 'Жанр повествования', file: 'master/genre.html' },
      { id: 'how-to-gm', title: 'Как водить игру', file: 'master/how-to-gm.html' },
      { id: 'long-term-projects', title: 'Долгосрочные проекты', file: 'master/long-term-projects.html' },
      { id: 'milestones', title: 'Вехи', file: 'master/milestones.html' },
      { id: 'mage-power-level', title: 'Уровень Силы Мага', file: 'master/mage-power-level.html' },
    ],
  },
  craftbook: {
    title: 'Craftbook',
    locked: true,
    chapters: [
      { id: 'intro', title: 'Введение', file: 'craftbook/intro.html' },
      { id: 'professions', title: 'Виды профессий', file: 'craftbook/professions.html' },
      { id: 'magical-crafts', title: 'Магические ремесла', file: 'craftbook/magical-crafts.html' },
    ],
  },
  rumors: {
    title: 'Compendium of Rumors',
    locked: true,
    chapters: [
      { id: 'intro', title: 'Введение', file: 'rumors/intro.html' },
      { id: 'ideas', title: 'Идеи', file: 'rumors/ideas.html' },
    ],
  },
};
