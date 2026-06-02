export interface ColumnDescriptor {
  key: string;
  label: string;
  contexts?: string[];
}

export interface FilterDescriptor {
  key: string;
  label: string;
  sourceField?: string;
  options?: string[];
  split?: boolean;
  numeric?: boolean;
  formatter?: 'stars';
}

export interface EntitySchema {
  columns: ColumnDescriptor[];
  filters: FilterDescriptor[];
}

export type SchemaMap = Record<string, EntitySchema>;

export const COMPENDIUM_SCHEMAS: SchemaMap = {
  spells: {
    columns: [
      { key: 'name', label: 'Название', contexts: ['db', 'popup'] },
      { key: 'school', label: 'Школа', contexts: ['db', 'popup'] },
      { key: 'type', label: 'Тип', contexts: ['db', 'popup'] },
      { key: 'requiredLevel', label: 'Требуемый Уровень', contexts: ['db', 'popup'] },
    ],
    filters: [
      { key: 'type', label: 'Тип', sourceField: 'type', split: true },
      { key: 'school', label: 'Школа', sourceField: 'school' },
      { key: 'damage', label: 'Тип урона', sourceField: 'damageType', split: true },
      { key: 'concentration', label: 'Концентрация', options: ['Да', 'Нет'] },
      {
        key: 'subspell',
        label: 'Является Подзаклинанием',
        sourceField: 'isSubSpell',
        options: ['Да', 'Нет'],
      },
      {
        key: 'requiredLevel',
        label: 'Требуемый уровень',
        sourceField: 'requiredLevel',
        numeric: true,
      },
      { key: 'signature', label: 'Фирменное заклинание', options: ['Да', 'Нет'] },
      { key: 'source', label: 'Источник', options: ['Учебное', 'Фирменное'] },
    ],
  },
  schools: {
    columns: [
      { key: 'name', label: 'Название', contexts: ['db', 'popup'] },
      { key: 'rarity', label: 'Редкость', contexts: ['db', 'popup'] },
      { key: 'difficulty', label: 'Сложность', contexts: ['db', 'popup'] },
      { key: 'properties', label: 'Свойства', contexts: ['db', 'popup'] },
    ],
    filters: [
      { key: 'rarity', label: 'Редкость', sourceField: 'rarity' },
      { key: 'properties', label: 'Свойства', sourceField: 'properties' },
      { key: 'difficulty', label: 'Сложность', sourceField: 'difficulty', formatter: 'stars' },
    ],
  },
  effects: {
    columns: [
      { key: 'name', label: 'Название' },
      { key: 'actionType', label: 'Тип действия' },
    ],
    filters: [{ key: 'actionType', label: 'Тип действия', sourceField: 'actionType' }],
  },
  skills: {
    columns: [
      { key: 'name', label: 'Название' },
      { key: 'type', label: 'Тип навыка' },
    ],
    filters: [{ key: 'type', label: 'Тип навыка', sourceField: 'type' }],
  },
  actions: {
    columns: [
      { key: 'name', label: 'Название' },
      { key: 'kind', label: 'Тип' },
    ],
    filters: [{ key: 'kind', label: 'Тип', sourceField: 'kind' }],
  },
  recipes: {
    columns: [
      { key: 'name', label: 'Название' },
      { key: 'profession', label: 'Профессия' },
      { key: 'specialization', label: 'Специализация' },
      { key: 'recipeLevel', label: 'Уровень' },
      { key: 'recipeRarity', label: 'Редкость' },
    ],
    filters: [
      { key: 'profession', label: 'Профессия', sourceField: 'profession' },
      { key: 'specialization', label: 'Специализация', sourceField: 'specialization' },
      { key: 'recipeLevel', label: 'Уровень', sourceField: 'recipeLevel', numeric: true },
      { key: 'recipeRarity', label: 'Редкость', sourceField: 'recipeRarity' },
      { key: 'recipeType', label: 'Тип рецепта', sourceField: 'recipeTypes' },
    ],
  },
  archetypes: {
    columns: [
      { key: 'name', label: 'Название' },
      { key: 'description', label: 'Описание' },
    ],
    filters: [],
  },
  basics: {
    columns: [
      { key: 'name', label: 'Название' },
      { key: 'description', label: 'Описание' },
    ],
    filters: [],
  },
  'action-types': {
    columns: [
      { key: 'name', label: 'Название' },
      { key: 'description', label: 'Описание' },
    ],
    filters: [],
  },
  combat: {
    columns: [
      { key: 'name', label: 'Название' },
      { key: 'description', label: 'Описание' },
    ],
    filters: [],
  },
  'craft-components': {
    columns: [
      { key: 'name', label: 'Название' },
      { key: 'description', label: 'Описание' },
    ],
    filters: [],
  },
  'craft-professions': {
    columns: [
      { key: 'name', label: 'Название' },
      { key: 'description', label: 'Описание' },
    ],
    filters: [],
  },
  'craft-specializations': {
    columns: [
      { key: 'name', label: 'Название' },
      { key: 'profession', label: 'Профессия' },
      { key: 'description', label: 'Описание' },
    ],
    filters: [],
  },
  'recipe-types': {
    columns: [
      { key: 'name', label: 'Название' },
      { key: 'description', label: 'Описание' },
    ],
    filters: [],
  },
};
