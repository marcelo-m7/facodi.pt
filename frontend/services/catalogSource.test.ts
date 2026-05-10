import { describe, expect, it } from 'vitest';
import { findPlaylistForUnit } from './catalogSource';
import { Category, Difficulty } from '../types';

describe('catalog mapper helpers', () => {
  it('matches playlist by course_code + unit_code', () => {
    const unit = { id: 'U1', courseId: 'C1', name: '', description: '', ects: 0, semester: 1, year: 1, category: Category.DESIGN, difficulty: Difficulty.FOUNDATIONAL, duration: '', contributor: '', tags: [] };
    const match = findPlaylistForUnit(unit, [{ id: 'P1', title: 'A', description: '', units: ['U1'], estimatedHours: 1, creator: 'x', course_code: 'C1', unit_code: 'U1' }]);
    expect(match?.id).toBe('P1');
  });
});
