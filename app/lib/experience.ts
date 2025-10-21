/**
 * Utility for calculating years of experience since Axis Maps was founded
 */

const FOUNDING_YEAR = 2006;

/**
 * Calculate the number of years of experience since Axis Maps was founded
 * @returns The number of years since founding (2006)
 */
export function getYearsOfExperience(): number {
  const currentYear = new Date().getFullYear();
  return currentYear - FOUNDING_YEAR;
}

/**
 * Get the founding year of Axis Maps
 * @returns The founding year (2006)
 */
export function getFoundingYear(): number {
  return FOUNDING_YEAR;
}