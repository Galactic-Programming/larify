// Shared constants for Projects

interface PresetColor {
    name: string;
    value: string;
}

// Preset colors for project
export const PRESET_COLORS: PresetColor[] = [
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Lime', value: '#84cc16' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Slate', value: '#64748b' },
];

// Check if color is a preset color
export const isPresetColor = (color: string) =>
    PRESET_COLORS.some((c) => c.value.toLowerCase() === color.toLowerCase());
