import { describe, expect, it } from 'vitest';

import { applyOverrides, flattenText, setByPath } from './paths';

const base = {
    hero: { title: 'Hire the best,', kicker: '' },
    highlights: [
        { title: 'One', points: ['a', 'b'] },
        { title: 'Two', points: ['c'] },
    ],
};

describe('flattenText', () => {
    it('indexes every string leaf by dot-path, arrays included', () => {
        expect(flattenText(base)).toEqual({
            'hero.title': 'Hire the best,',
            'hero.kicker': '',
            'highlights.0.title': 'One',
            'highlights.0.points.0': 'a',
            'highlights.0.points.1': 'b',
            'highlights.1.title': 'Two',
            'highlights.1.points.0': 'c',
        });
    });

    it('round-trips through setByPath', () => {
        const clone = structuredClone(base);
        for (const [path, value] of Object.entries(flattenText(base))) setByPath(clone, path, value);
        expect(clone).toEqual(base);
    });
});

describe('applyOverrides', () => {
    it('overrides only the given paths and leaves the source untouched', () => {
        const merged = applyOverrides(base, { 'hero.title': 'New title', 'highlights.0.points.1': 'B' });
        expect(merged.hero.title).toBe('New title');
        expect(merged.highlights[0].points).toEqual(['a', 'B']);
        expect(merged.highlights[1].title).toBe('Two');
        expect(base.hero.title).toBe('Hire the best,');
    });

    it('falls back to the constant for empty, null and unknown paths', () => {
        const merged = applyOverrides(base, {
            'hero.title': '',
            'highlights.0.title': null,
            'hero.nothing.here': 'ignored',
            'highlights.9.title': 'ignored',
        });
        expect(merged).toEqual(base);
    });
});
