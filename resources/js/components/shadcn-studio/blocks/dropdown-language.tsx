import type { ReactNode } from 'react';
import { useState } from 'react';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type Language = {
    value: string;
    label: string;
};

type Props = {
    trigger: ReactNode;
    defaultOpen?: boolean;
    align?: 'start' | 'center' | 'end';
    languages?: Language[];
    defaultLanguage?: string;
    onLanguageChange?: (language: string) => void;
};

const defaultLanguages: Language[] = [
    { value: 'en', label: 'English' },
    { value: 'vi', label: 'Tiếng Việt' },
];

const LanguageDropdown = ({
    defaultOpen,
    align = 'end',
    trigger,
    languages = defaultLanguages,
    defaultLanguage = 'en',
    onLanguageChange,
}: Props) => {
    const [language, setLanguage] = useState(defaultLanguage);

    const handleLanguageChange = (value: string) => {
        setLanguage(value);
        onLanguageChange?.(value);
    };

    return (
        <DropdownMenu defaultOpen={defaultOpen}>
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
            <DropdownMenuContent className="w-50" align={align}>
                <DropdownMenuRadioGroup
                    value={language}
                    onValueChange={handleLanguageChange}
                >
                    {languages.map((lang) => (
                        <DropdownMenuRadioItem
                            key={lang.value}
                            value={lang.value}
                            className="pl-2 text-base data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground [&>span]:hidden"
                        >
                            {lang.label}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default LanguageDropdown;
