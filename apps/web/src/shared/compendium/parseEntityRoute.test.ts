import { describe, it, expect } from 'vitest';
import { parseEntityRoute } from './CompendiumOverlayContext';

describe('parseEntityRoute', () => {
  it('parses the news tab+detail format', () => {
    expect(parseEntityRoute('#/db?tab=spells&detail=ognenny-shar')).toEqual({
      entityType: 'spells',
      id: 'ognenny-shar',
    });
  });

  it('parses a hyphenated entity type tab', () => {
    expect(parseEntityRoute('#/db?tab=craft-professions&detail=alhimik')).toEqual({
      entityType: 'craft-professions',
      id: 'alhimik',
    });
  });

  it('parses legacy single-param links from book text', () => {
    expect(parseEntityRoute('/db?spell=fireball')).toEqual({
      entityType: 'spells',
      id: 'fireball',
    });
    expect(parseEntityRoute('db.html?school=fire')).toEqual({
      entityType: 'schools',
      id: 'fire',
    });
    expect(parseEntityRoute('/db?craftComponent=quick')).toEqual({
      entityType: 'craft-components',
      id: 'quick',
    });
  });

  it('returns null for a tab without a detail', () => {
    expect(parseEntityRoute('#/db?tab=combat')).toBeNull();
  });

  it('returns null for an unknown tab', () => {
    expect(parseEntityRoute('#/db?tab=nonsense&detail=x')).toBeNull();
  });

  it('returns null for non-DB routes', () => {
    expect(parseEntityRoute('#/phb/intro')).toBeNull();
    expect(parseEntityRoute('#/profile')).toBeNull();
    expect(parseEntityRoute('#/db')).toBeNull();
  });
});
