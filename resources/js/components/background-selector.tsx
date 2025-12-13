import {
    BACKGROUND_OPTIONS,
    BackgroundImage,
    useBackgroundContext,
} from '@/hooks/use-background';
import { cn } from '@/lib/utils';
import { Check, ImageOff } from 'lucide-react';
import { HTMLAttributes } from 'react';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

type BackgroundSelectorProps = HTMLAttributes<HTMLDivElement>;

export default function BackgroundSelector({
    className,
    ...props
}: BackgroundSelectorProps) {
    const { config, updateBackground } = useBackgroundContext();

    const handleImageSelect = (image: BackgroundImage) => {
        updateBackground({ image });
    };

    const handleOpacityChange = (value: number[]) => {
        updateBackground({ opacity: value[0] });
    };

    return (
        <div className={cn('space-y-6', className)} {...props}>
            {/* Background Image Selection */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">Background Image</Label>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                    {BACKGROUND_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => handleImageSelect(option.value)}
                            className={cn(
                                'group relative aspect-video overflow-hidden rounded-lg border-2 transition-all',
                                config.image === option.value
                                    ? 'border-primary ring-2 ring-primary/20'
                                    : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600',
                            )}
                        >
                            {option.thumbnail ? (
                                <img
                                    src={option.thumbnail}
                                    alt={option.label}
                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-neutral-100 dark:bg-neutral-800">
                                    <ImageOff className="h-5 w-5 text-neutral-400" />
                                </div>
                            )}

                            {/* Selected indicator */}
                            {config.image === option.value && (
                                <div className="bg-primary absolute right-1 top-1 rounded-full p-0.5">
                                    <Check className="h-3 w-3 text-white" />
                                </div>
                            )}

                            {/* Label overlay */}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                                <span className="text-xs font-medium text-white">
                                    {option.label}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Opacity Slider - Only show when a background is selected */}
            {config.image !== 'none' && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                            Background Opacity
                        </Label>
                        <span className="text-sm text-neutral-500">
                            {config.opacity}%
                        </span>
                    </div>
                    <Slider
                        value={[config.opacity]}
                        onValueChange={handleOpacityChange}
                        min={10}
                        max={100}
                        step={10}
                        className="w-full"
                    />
                    <p className="text-xs text-neutral-500">
                        Adjust the visibility of the background image. Higher
                        values make the background more visible.
                    </p>
                </div>
            )}
        </div>
    );
}
