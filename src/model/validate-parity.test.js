import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';

// The handoff requires the JS validate() and validate.py to agree. This guards
// that the Python gate still passes on the source table. Skips if python3 is absent.
function hasPython() {
  try { execFileSync('python3', ['--version'], { stdio: 'ignore' }); return true; } catch { return false; }
}

describe('validate.py parity', () => {
  it.skipIf(!hasPython())('the Python gate passes on the source table', () => {
    const out = execFileSync('python3', ['scripts/validate.py', 'src/data/compound_rooms.json'], { encoding: 'utf8' });
    expect(out).toContain('ALL CHECKS PASS');
  });
});
