import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { getYearsOfExperience, getFoundingYear } from './experience';

describe('Experience utilities', () => {
  beforeEach(() => {
    // Reset any date mocks before each test
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getFoundingYear', () => {
    test('should return 2006 as the founding year', () => {
      expect(getFoundingYear()).toBe(2006);
    });
  });

  describe('getYearsOfExperience', () => {
    test('should calculate correct years from 2006', () => {
      // Mock the current year to 2024
      const mockDate = new Date('2024-01-01');
      vi.setSystemTime(mockDate);
      
      expect(getYearsOfExperience()).toBe(18); // 2024 - 2006 = 18
    });

    test('should calculate correct years for different years', () => {
      // Test for 2025
      const mockDate2025 = new Date('2025-01-01');
      vi.setSystemTime(mockDate2025);
      
      expect(getYearsOfExperience()).toBe(19); // 2025 - 2006 = 19
    });

    test('should calculate correct years for founding year', () => {
      // Test for the founding year itself
      const mockDate2006 = new Date('2006-12-31');
      vi.setSystemTime(mockDate2006);
      
      expect(getYearsOfExperience()).toBe(0); // 2006 - 2006 = 0
    });

    test('should calculate correct years for the year after founding', () => {
      // Test for 2007
      const mockDate2007 = new Date('2007-06-15');
      vi.setSystemTime(mockDate2007);
      
      expect(getYearsOfExperience()).toBe(1); // 2007 - 2006 = 1
    });

    test('should work with current real date', () => {
      // Test with actual current year (no mocking)
      const currentYear = new Date().getFullYear();
      const expectedYears = currentYear - 2006;
      
      expect(getYearsOfExperience()).toBe(expectedYears);
      expect(getYearsOfExperience()).toBeGreaterThanOrEqual(18); // Should be at least 18 in 2024+
    });
  });
});