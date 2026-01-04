import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import type { TaskPriority } from '../../../lib/types';
import { PRIORITY_OPTIONS } from './constants';

interface PrioritySelectProps {
    value: TaskPriority;
    onChange: (value: TaskPriority) => void;
    error?: string;
    showAIButton?: boolean;
    onAISuggest?: () => void;
    isAISuggesting?: boolean;
    canSuggest?: boolean;
}

export function PrioritySelect({
    value,
    onChange,
    error,
    showAIButton = false,
    onAISuggest,
    isAISuggesting = false,
    canSuggest = true,
}: PrioritySelectProps) {
    return (
        <div className="grid gap-2">
            <div className="flex items-center justify-between">
                <Label>Priority</Label>
                {showAIButton && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 gap-1 px-2 text-xs text-muted-foreground hover:text-primary"
                                onClick={onAISuggest}
                                disabled={isAISuggesting || !canSuggest}
                            >
                                {isAISuggesting ? (
                                    <Spinner className="size-3" />
                                ) : (
                                    <Sparkles className="size-3" />
                                )}
                                Suggest
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            {!canSuggest
                                ? 'Enter a task title first'
                                : 'Suggest priority with AI'}
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
            <Select
                value={value}
                onValueChange={(v) => onChange(v as TaskPriority)}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                    {PRIORITY_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        return (
                            <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                    <Icon
                                        className={`size-4 ${option.color}`}
                                    />
                                    <span>{option.label}</span>
                                </div>
                            </SelectItem>
                        );
                    })}
                </SelectContent>
            </Select>
            <input type="hidden" name="priority" value={value} />
            <InputError message={error} />
        </div>
    );
}
