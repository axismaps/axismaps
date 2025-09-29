import { describe, it, expect, beforeEach, vi } from 'vitest';
import { formatDate } from './date';

describe('Date Utilities', () => {
  beforeEach(() => {
    // Mock the current date to ensure consistent test results
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-12-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatDate', () => {
    describe('default formatting', () => {
      it('should format date with month, day, and year', () => {
        const result = formatDate('2024-01-15');
        expect(result).toBe('January 15, 2024');
      });

      it('should handle different date formats', () => {
        expect(formatDate('2023-12-25')).toBe('December 25, 2023');
        expect(formatDate('2024-07-04')).toBe('July 4, 2024');
        expect(formatDate('2024-02-29')).toBe('February 29, 2024'); // Leap year
      });

      it('should handle ISO date strings', () => {
        const result = formatDate('2024-03-10T15:30:00Z');
        expect(result).toBe('March 10, 2024');
      });

      it('should handle dates at year boundaries', () => {
        expect(formatDate('2023-12-31')).toBe('December 31, 2023');
        expect(formatDate('2024-01-01')).toBe('January 1, 2024');
      });
    });

    describe('with dayMonth option', () => {
      it('should format date with only month and day', () => {
        const result = formatDate('2024-06-15', { dayMonth: true });
        expect(result).toBe('June 15');
      });

      it('should handle various months', () => {
        expect(formatDate('2024-01-01', { dayMonth: true })).toBe('January 1');
        expect(formatDate('2024-12-31', { dayMonth: true })).toBe('December 31');
        expect(formatDate('2024-02-14', { dayMonth: true })).toBe('February 14');
      });
    });

    describe('with includeRelative option', () => {
      it('should show "today" for current date', () => {
        const result = formatDate('2024-12-15', { includeRelative: true });
        expect(result).toBe('December 15, 2024 (today)');
      });

      it('should show days ago for recent dates', () => {
        expect(formatDate('2024-12-14', { includeRelative: true }))
          .toBe('December 14, 2024 (1d ago)');
        expect(formatDate('2024-12-10', { includeRelative: true }))
          .toBe('December 10, 2024 (5d ago)');
        expect(formatDate('2024-11-30', { includeRelative: true }))
          .toBe('November 30, 2024 (15d ago)');
      });

      it('should show months ago for older dates', () => {
        expect(formatDate('2024-11-15', { includeRelative: true }))
          .toBe('November 15, 2024 (1mo ago)');
        expect(formatDate('2024-10-15', { includeRelative: true }))
          .toBe('October 15, 2024 (2mo ago)');
        expect(formatDate('2024-06-15', { includeRelative: true }))
          .toBe('June 15, 2024 (6mo ago)');
      });

      it('should show years ago for dates over a year old', () => {
        expect(formatDate('2023-12-14', { includeRelative: true }))
          .toBe('December 14, 2023 (1y ago)');
        expect(formatDate('2022-12-15', { includeRelative: true }))
          .toBe('December 15, 2022 (2y ago)');
        expect(formatDate('2020-01-01', { includeRelative: true }))
          .toBe('January 1, 2020 (4y ago)');
      });


      it('should handle future dates', () => {
        // Future dates will have negative diff, resulting in "today"
        const result = formatDate('2024-12-20', { includeRelative: true });
        expect(result).toBe('December 20, 2024 (today)');
      });
    });

    describe('edge cases', () => {
      it('should handle invalid date strings', () => {
        const result = formatDate('invalid-date');
        expect(result).toBe('Invalid Date');
      });

      it('should handle empty string', () => {
        const result = formatDate('');
        expect(result).toBe('Invalid Date');
      });

      it('should handle very old dates', () => {
        const result = formatDate('1900-01-01');
        expect(result).toBe('January 1, 1900');
      });

      it('should handle far future dates', () => {
        const result = formatDate('2100-12-31');
        expect(result).toBe('December 31, 2100');
      });

      it('should handle dates with time components correctly', () => {
        // Should ignore time and use UTC
        const result = formatDate('2024-06-15T23:59:59Z');
        expect(result).toBe('June 15, 2024');
      });

      it('should handle combined options', () => {
        // Both options together - includeRelative should take precedence
        const result = formatDate('2024-11-15', {
          includeRelative: true,
          dayMonth: true
        });
        expect(result).toBe('November 15, 2024 (1mo ago)');
      });
    });

    describe('timezone handling', () => {
      it('should use UTC timezone consistently', () => {
        // Date right at midnight UTC
        const result = formatDate('2024-01-15T00:00:00Z');
        expect(result).toBe('January 15, 2024');
      });

      it('should handle dates near timezone boundaries', () => {
        // Just before midnight UTC
        const result1 = formatDate('2024-01-14T23:59:59Z');
        expect(result1).toBe('January 14, 2024');

        // Just after midnight UTC
        const result2 = formatDate('2024-01-15T00:00:01Z');
        expect(result2).toBe('January 15, 2024');
      });
    });
  });
});