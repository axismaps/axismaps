import { describe, it, expect } from 'vitest';
import { getClients, getProjects } from './utils';

// Unlike utils.test.ts, nothing here is mocked. That file mocks `fs` and
// `../lib/data-loader`, so its assertions cover which arguments reach
// loadDataFile but never whether a file exists at the path those arguments
// resolve to. getClients() answers a missing file with its empty default, so
// clients.json sat unread at the wrong path with the whole suite green.
//
// These tests read the real files instead, which is the only way this class of
// bug — a moved data file, a typo'd clientSlug, a client with no record — fails
// in CI rather than at runtime. Nothing currently renders client data, so there
// is no page to notice when it breaks.
describe('client data integrity', () => {
  it('should load clients from the path getClients() actually reads', () => {
    expect(Object.keys(getClients()).length).toBeGreaterThan(0);
  });

  it('should key every client by its own slug and give it a name', () => {
    const malformed = Object.entries(getClients())
      .filter(([key, client]) => client.slug !== key || !client.name)
      .map(([key]) => key);

    expect(malformed).toEqual([]);
  });

  it('should resolve every project clientSlug to a client record', () => {
    const clients = getClients();

    const unresolved = getProjects()
      .map((project) => ({
        project: project.slug,
        clientSlug: project.metadata.clientSlug,
      }))
      .filter(
        (entry): entry is { project: string; clientSlug: string } =>
          typeof entry.clientSlug === 'string' && entry.clientSlug.length > 0,
      )
      .filter((entry) => !clients[entry.clientSlug])
      .map((entry) => `${entry.project} -> ${entry.clientSlug}`);

    expect(unresolved).toEqual([]);
  });
});
