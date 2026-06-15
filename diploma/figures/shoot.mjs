import { createRequire } from 'module';
const require = createRequire(
  'C:/Users/Kaliguri/AppData/Roaming/npm/node_modules/@mermaid-js/mermaid-cli/package.json',
);
const puppeteer = require('puppeteer');

const BASE = 'http://localhost:5173/E-Magios-Core-Site/#';
const OUT = 'C:/Gamedev/E-Magios-Core-Site/diploma/figures/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1320, height: 900, deviceScaleFactor: 1.5 });

async function go(route, ms = 2500) {
  await page.goto(BASE + route, { waitUntil: 'networkidle2' }).catch(() => {});
  await sleep(ms);
}
async function shot(name) {
  await page.screenshot({ path: OUT + name + '.png' });
  console.log('shot', name);
}

try {
  // 3.8 Главная
  await go('/'); await shot('fig_3_8');

  // 3.1 База данных
  await go('/db', 3500); await shot('fig_3_1');

  // 3.2 Детальная карточка — клик по первой строке таблицы
  try {
    await page.evaluate(() => {
      const row = document.querySelector('tbody tr');
      if (row) row.click();
    });
    await sleep(1800); await shot('fig_3_2');
  } catch (e) { console.log('3.2 fail', e.message); }

  // 3.3 Книга правил
  await go('/phb/intro', 3000); await shot('fig_3_3');

  // 3.4 Редактор персонажей
  await go('/character-editor', 3000); await shot('fig_3_4');

  // 3.5 Виджет кубов — открыть на главной
  await go('/');
  try {
    await page.click('button[aria-label="Открыть броски кубов"]');
    await sleep(1500); await shot('fig_3_5');
  } catch (e) { console.log('3.5 fail', e.message); }

  // 3.6 Профиль
  await go('/profile', 2500); await shot('fig_3_6');

  // 3.7 Дашборд (может редиректить, если не editor)
  await go('/dashboard', 2500);
  const url = page.url();
  console.log('dashboard url:', url);
  await shot('fig_3_7');
} finally {
  await browser.close();
}
console.log('done');
