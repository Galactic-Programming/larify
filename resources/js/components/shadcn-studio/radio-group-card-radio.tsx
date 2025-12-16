import { useId } from 'react'

import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

export interface RadioCardOption {
    value: string
    label: string
    description?: string
    badge?: string
    disabled?: boolean
}

export interface RadioGroupCardProps {
    options: RadioCardOption[]
    value?: string
    defaultValue?: string
    onChange?: (value: string) => void
    name?: string
    className?: string
    orientation?: 'vertical' | 'horizontal'
}

const RadioGroupCard = ({
    options,
    value,
    defaultValue,
    onChange,
    name,
    className,
    orientation = 'vertical',
}: RadioGroupCardProps) => {
    const id = useId()

    return (
        <RadioGroup
            name={name}
            value={value}
            defaultValue={defaultValue}
            onValueChange={onChange}
            className={cn(
                'w-full gap-2',
                orientation === 'horizontal' && 'flex flex-row flex-wrap',
                className
            )}
        >
            {options.map((option, index) => (
                <div
                    key={option.value}
                    className={cn(
                        'border-input has-data-[state=checked]:border-primary/50 has-data-[state=checked]:bg-primary/5 relative flex w-full items-center gap-3 rounded-md border p-4 shadow-xs outline-none transition-colors',
                        option.disabled && 'opacity-50 cursor-not-allowed',
                        orientation === 'horizontal' && 'flex-1 min-w-50'
                    )}
                >
                    <RadioGroupItem
                        value={option.value}
                        id={`${id}-${index}`}
                        disabled={option.disabled}
                        aria-describedby={option.description ? `${id}-${index}-description` : undefined}
                        className="size-5 after:absolute after:inset-0 [&_svg]:size-3"
                    />
                    <div className="grid grow gap-1">
                        <Label
                            htmlFor={`${id}-${index}`}
                            className={cn(
                                'flex items-center justify-between gap-2',
                                option.disabled && 'cursor-not-allowed'
                            )}
                        >
                            <span>{option.label}</span>
                            {option.badge && (
                                <span className="text-muted-foreground text-xs font-normal">{option.badge}</span>
                            )}
                        </Label>
                        {option.description && (
                            <p id={`${id}-${index}-description`} className="text-muted-foreground text-xs">
                                {option.description}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </RadioGroup>
    )
}

export { RadioGroupCard }
export default RadioGroupCard
