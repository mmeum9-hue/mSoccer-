import React from 'react';

export const DEFAULT_PLAYER_AVATAR = "/default-avatar.svg";

// Fallback SVG Data URI in case relative path fails
export const DEFAULT_PLAYER_AVATAR_DATA_URI = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 500'><circle cx='250' cy='250' r='250' fill='%23000000'/><circle cx='250' cy='180' r='85' fill='%23ffffff'/><path d='M 125 410 C 125 310 185 270 250 270 C 315 270 375 310 375 410 C 375 430 360 440 340 440 L 160 440 C 140 440 125 430 125 410 Z' fill='%23ffffff'/></svg>";

/**
 * Returns player photoUrl if present, otherwise DEFAULT_PLAYER_AVATAR
 */
export function getPlayerPhoto(photoUrl?: string | null): string {
  if (!photoUrl || typeof photoUrl !== 'string' || !photoUrl.trim()) {
    return DEFAULT_PLAYER_AVATAR;
  }
  return photoUrl;
}

/**
 * Handle image error for player photos, smoothly replacing broken links with default avatar
 */
export function handlePlayerImageError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
  const target = e.currentTarget;
  if (target.src !== DEFAULT_PLAYER_AVATAR && target.src !== DEFAULT_PLAYER_AVATAR_DATA_URI) {
    target.onerror = null; // Prevent infinite error loop
    target.src = DEFAULT_PLAYER_AVATAR;
  }
}
