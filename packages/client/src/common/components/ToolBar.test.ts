import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ToolBar } from './ToolBar.js';

describe('ToolBar Component (OB-196)', () => {
  it('exports ToolBar component', () => {
    assert.strictEqual(typeof ToolBar, 'function');
  });
});
