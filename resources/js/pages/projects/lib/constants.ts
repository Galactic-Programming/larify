// Shared constants for Projects

interface PresetColor {
    name: string;
    value: string;
    isPro?: boolean; // If true, only available for Pro users
}

// Preset colors for project
// First 6 colors are available to Free users, rest require Pro
export const PRESET_COLORS: PresetColor[] = [
    // Free colors (first 6)
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Slate', value: '#64748b' },
    // Pro colors (remaining 6)
    { name: 'Teal', value: '#14b8a6', isPro: true },
    { name: 'Lime', value: '#84cc16', isPro: true },
    { name: 'Yellow', value: '#eab308', isPro: true },
    { name: 'Red', value: '#ef4444', isPro: true },
    { name: 'Pink', value: '#ec4899', isPro: true },
    { name: 'Purple', value: '#a855f7', isPro: true },
];

// Get colors available for a user based on their plan
export const getAvailableColors = (hasFullPalette: boolean): PresetColor[] =>
    hasFullPalette
        ? PRESET_COLORS
        : PRESET_COLORS.filter((c) => !c.isPro);

// Free users get first 6 colors only
export const FREE_COLORS_COUNT = 6;

// Check if color is a preset color
export const isPresetColor = (color: string) =>
    PRESET_COLORS.some((c) => c.value.toLowerCase() === color.toLowerCase());

// Check if color is a Pro-only color
export const isProColor = (color: string) =>
    PRESET_COLORS.find(
        (c) => c.value.toLowerCase() === color.toLowerCase(),
    )?.isPro ?? false;
