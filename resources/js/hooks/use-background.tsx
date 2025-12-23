import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useState,
} from 'react';

export type BackgroundImage =
    | 'none'
    | 'planet-space'
    | 'cosmic-nebula-1'
    | 'cosmic-nebula-2'
    | 'space-sun-planets';

export interface BackgroundConfig {
    image: BackgroundImage;
    opacity: number; // 0-100
}

const BACKGROUND_IMAGES: Record<BackgroundImage, string | null> = {
    none: null,
    'planet-space':
        '/backgrounds/planet-space-4k-wallpaper-uhdpaper.com-173@5@c.jpg',
    'cosmic-nebula-1':
        '/backgrounds/space-cosmic-nebula-4k-wallpaper-uhdpaper.com-290@5@i.jpg',
    'cosmic-nebula-2':
        '/backgrounds/space-cosmic-nebula-4k-wallpaper-uhdpaper.com-291@5@i.jpg',
    'space-sun-planets':
        '/backgrounds/space-sun-planets-4k-wallpaper-uhdpaper.com-316@5@j.jpg',
};

export const BACKGROUND_OPTIONS: {
    value: BackgroundImage;
    label: string;
    thumbnail: string | null;
}[] = [
    { value: 'none', label: 'None', thumbnail: null },
    {
        value: 'planet-space',
        label: 'Planet Space',
        thumbnail: BACKGROUND_IMAGES['planet-space'],
    },
    {
        value: 'cosmic-nebula-1',
        label: 'Cosmic Nebula 1',
        thumbnail: BACKGROUND_IMAGES['cosmic-nebula-1'],
    },
    {
        value: 'cosmic-nebula-2',
        label: 'Cosmic Nebula 2',
        thumbnail: BACKGROUND_IMAGES['cosmic-nebula-2'],
    },
    {
        value: 'space-sun-planets',
        label: 'Space Sun Planets',
        thumbnail: BACKGROUND_IMAGES['space-sun-planets'],
    },
];

const DEFAULT_CONFIG: BackgroundConfig = {
    image: 'none',
    opacity: 20,
};

const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') {
        return;
    }

    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

export function getBackgroundUrl(image: BackgroundImage): string | null {
    return BACKGROUND_IMAGES[image] || null;
}

function getInitialConfig(): BackgroundConfig {
    if (typeof window === 'undefined') {
        return DEFAULT_CONFIG;
    }

    const saved = localStorage.getItem('background');
    if (saved) {
        try {
            return JSON.parse(saved) as BackgroundConfig;
        } catch {
            // Invalid JSON, use default
        }
    }
    return DEFAULT_CONFIG;
}

export function useBackground() {
    const [config, setConfig] = useState<BackgroundConfig>(getInitialConfig);

    const updateBackground = useCallback(
        (newConfig: Partial<BackgroundConfig>) => {
            setConfig((prev) => {
                const updated = { ...prev, ...newConfig };

                // Store in localStorage for client-side persistence...
                localStorage.setItem('background', JSON.stringify(updated));

                // Store in cookie for SSR...
                setCookie('background', JSON.stringify(updated));

                return updated;
            });
        },
        [],
    );

    return {
        config,
        updateBackground,
        backgroundUrl: getBackgroundUrl(config.image),
    };
}

// Context for sharing background state across components
interface BackgroundContextType {
    config: BackgroundConfig;
    updateBackground: (newConfig: Partial<BackgroundConfig>) => void;
    backgroundUrl: string | null;
}

const BackgroundContext = createContext<BackgroundContextType | null>(null);

export function BackgroundProvider({ children }: { children: ReactNode }) {
    const background = useBackground();

    return (
        <BackgroundContext.Provider value={background}>
            {children}
        </BackgroundContext.Provider>
    );
}

export function useBackgroundContext() {
    const context = useContext(BackgroundContext);
    if (!context) {
        throw new Error(
            'useBackgroundContext must be used within a BackgroundProvider',
        );
    }
    return context;
}
