import { existsSync } from 'fs';
import path from 'path';
import { describe, test, expect } from 'vitest';
import clientLogos from './client-logos.json';

describe('client logos', () => {
  test('includes CPRE', () => {
    expect(clientLogos.map((client) => client.shortName)).toContain('CPRE');
  });

  test('stays in alphabetical order by name', () => {
    const names = clientLogos.map((client) => client.name);

    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en')));
  });

  test.each(clientLogos)('$shortName points at a file under public/', ({ logo }) => {
    expect(existsSync(path.join(process.cwd(), 'public', logo))).toBe(true);
  });
});
