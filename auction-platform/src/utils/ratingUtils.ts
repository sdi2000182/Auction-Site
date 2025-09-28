/**
 * Utility functions for handling user ratings
 */

/**
 * Converts backend rating to star rating (0-5)
 * Backend already sends ratings on 0-5 scale, so we just validate the range
 * @param rating - The rating value from backend (0-5 scale)
 * @returns Rating value between 0 and 5 for star display
 */
export const convertToStarRating = (rating: number | undefined | null): number => {
  if (rating === undefined || rating === null || rating < 0) {
    return 0;
  }

  // Ensure the result is between 0 and 5
  return Math.min(Math.max(rating, 0), 5);
};

/**
 * Formats rating for display with proper precision
 * @param rating - The rating value
 * @param precision - Number of decimal places (default: 1)
 * @returns Formatted rating string
 */
export const formatRating = (rating: number | undefined | null, precision: number = 1): string => {
  if (rating === undefined || rating === null) {
    return 'No rating';
  }

  return rating.toFixed(precision);
};

/**
 * Gets a descriptive rating text based on star rating
 * @param starRating - Rating on 0-5 scale
 * @returns Descriptive text for the rating
 */
export const getRatingDescription = (starRating: number): string => {
  if (starRating >= 4.5) return 'Excellent';
  if (starRating >= 4) return 'Very Good';
  if (starRating >= 3) return 'Good';
  if (starRating >= 2) return 'Fair';
  if (starRating > 0) return 'Poor';
  if (starRating === 0) return 'Not rated yet';
  return 'No rating';
};