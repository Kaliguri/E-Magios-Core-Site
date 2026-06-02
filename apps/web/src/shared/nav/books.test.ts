import { describe, it, expect } from 'vitest';
import { resolveBookLink, BOOKS } from './books';

describe('resolveBookLink', () => {
  it('routes a same-book chapter link relative to the current book', () => {
    expect(resolveBookLink('archetypes.html', 'phb')).toEqual({
      kind: 'route',
      route: '/phb/archetypes',
      anchor: undefined,
    });
  });

  it('keeps the anchor when present on a same-book link', () => {
    expect(resolveBookLink('stats.html#magic-mastery', 'phb')).toEqual({
      kind: 'route',
      route: '/phb/stats',
      anchor: 'magic-mastery',
    });
  });

  it('routes a cross-book link using the directory as the book key', () => {
    expect(resolveBookLink('../spellbook/schools.html', 'phb')).toEqual({
      kind: 'route',
      route: '/spellbook/schools',
      anchor: undefined,
    });
  });

  it('maps the legacy database page and preserves its query', () => {
    expect(resolveBookLink('../db.html', 'phb')).toEqual({
      kind: 'route',
      route: '/db',
      anchor: undefined,
    });
    expect(resolveBookLink('../db.html?tab=spells&detail=fireball', 'master')).toEqual({
      kind: 'route',
      route: '/db?tab=spells&detail=fireball',
      anchor: undefined,
    });
  });

  it('treats pure fragment links as in-page anchors', () => {
    expect(resolveBookLink('#health', 'phb')).toEqual({ kind: 'anchor', anchor: 'health' });
  });

  it('marks absolute and mailto links as external', () => {
    expect(resolveBookLink('https://example.com', 'phb')).toEqual({ kind: 'external' });
    expect(resolveBookLink('mailto:a@b.c', 'phb')).toEqual({ kind: 'external' });
  });

  it('ignores stylesheet/asset and empty links', () => {
    expect(resolveBookLink('../styles.css?v=9408e766', 'phb')).toEqual({ kind: 'ignore' });
    expect(resolveBookLink('', 'phb')).toEqual({ kind: 'ignore' });
  });

  it('routes the home page', () => {
    expect(resolveBookLink('../index.html', 'phb')).toEqual({
      kind: 'route',
      route: '/',
      anchor: undefined,
    });
  });

  it('falls back to the current book for unknown directories', () => {
    expect(resolveBookLink('subdir/leveling.html', 'master')).toEqual({
      kind: 'route',
      route: '/master/leveling',
      anchor: undefined,
    });
  });

  it('every known book key resolves its own relative chapter links', () => {
    for (const key of Object.keys(BOOKS)) {
      expect(resolveBookLink('intro.html', key)).toEqual({
        kind: 'route',
        route: `/${key}/intro`,
        anchor: undefined,
      });
    }
  });
});
