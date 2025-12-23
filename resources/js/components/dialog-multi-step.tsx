'use client';

import { AppWindowIcon as Apps } from 'lucide-react';
import { type ReactNode, useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export interface SelectOption {
    value: string;
    label: string;
}

export interface MultiStepField {
    id: string;
    label: string;
    description?: string;
    placeholder?: string;
    options: SelectOption[];
    defaultValue?: string;
}

export interface SidebarInfo {
    icon?: ReactNode;
    title: string;
    subtitle?: string;
    description?: string;
    additionalInfo?: string;
}

export interface DialogMultiStepProps {
    /** Controlled open state */
    open?: boolean;
    /** Default open state for uncontrolled mode */
    defaultOpen?: boolean;
    /** Callback when open state changes */
    onOpenChange?: (open: boolean) => void;
    /** Dialog title */
    dialogTitle?: string;
    /** Sidebar information */
    sidebarInfo?: SidebarInfo;
    /** Form fields/steps */
    fields: MultiStepField[];
    /** Callback when form is submitted */
    onSubmit?: (values: Record<string, string>) => void;
    /** Callback when cancel is clicked */
    onCancel?: () => void;
    /** Submit button text */
    submitButtonText?: string;
    /** Cancel button text */
    cancelButtonText?: string;
    /** Custom trigger element */
    trigger?: ReactNode;
    /** Whether to show the trigger */
    showTrigger?: boolean;
    /** Custom class name for dialog content */
    className?: string;
    /** Whether form submission is loading */
    isLoading?: boolean;
}

export default function DialogMultiStep({
    open: controlledOpen,
    defaultOpen = false,
    onOpenChange,
    dialogTitle = 'Initialize New Project',
    sidebarInfo = {
        icon: <Apps className="size-5 text-foreground" aria-hidden={true} />,
        title: 'Project Starter',
        subtitle: 'Configure your new codebase',
        description: 'Quickly set up the foundational tools for your project.',
        additionalInfo: 'Select your preferred stack and configurations.',
    },
    fields,
    onSubmit,
    onCancel,
    submitButtonText = 'Initialize',
    cancelButtonText = 'Cancel',
    trigger,
    showTrigger = true,
    className,
    isLoading = false,
}: DialogMultiStepProps) {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const [values, setValues] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        fields.forEach((field) => {
            if (field.defaultValue) {
                initial[field.id] = field.defaultValue;
            }
        });
        return initial;
    });

    const isControlled = controlledOpen !== undefined;
    const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

    const setOpen = useCallback(
        (value: boolean) => {
            if (!isControlled) {
                setUncontrolledOpen(value);
            }
            onOpenChange?.(value);
        },
        [isControlled, onOpenChange],
    );

    const handleValueChange = (fieldId: string, value: string) => {
        setValues((prev) => ({ ...prev, [fieldId]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit?.(values);
    };

    const handleCancel = () => {
        onCancel?.();
        setOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            {showTrigger && (
                <DialogTrigger asChild>
                    {trigger ?? <Button>{dialogTitle}</Button>}
                </DialogTrigger>
            )}
            <DialogContent
                className={`gap-0 overflow-visible p-0 sm:max-w-2xl ${className ?? ''}`}
            >
                <DialogHeader className="mb-0 border-b px-6 py-4">
                    <DialogTitle>{dialogTitle}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col-reverse md:flex-row">
                        <div className="flex flex-col justify-between md:w-80 md:border-r">
                            <div className="flex-1 grow">
                                <div className="border-t p-6 md:border-none">
                                    <div className="flex items-center space-x-3">
                                        <div className="inline-flex shrink-0 items-center justify-center rounded-sm bg-muted p-3">
                                            {sidebarInfo.icon}
                                        </div>
                                        <div className="space-y-0.5">
                                            <h3 className="text-sm font-medium text-foreground">
                                                {sidebarInfo.title}
                                            </h3>
                                            {sidebarInfo.subtitle && (
                                                <p className="text-sm text-muted-foreground">
                                                    {sidebarInfo.subtitle}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {(sidebarInfo.description ||
                                        sidebarInfo.additionalInfo) && (
                                        <>
                                            <Separator className="my-4" />
                                            {sidebarInfo.description && (
                                                <>
                                                    <h4 className="text-sm font-medium text-foreground">
                                                        Description
                                                    </h4>
                                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                                        {
                                                            sidebarInfo.description
                                                        }
                                                    </p>
                                                </>
                                            )}
                                            {sidebarInfo.additionalInfo && (
                                                <>
                                                    <h4 className="mt-6 text-sm font-medium text-foreground">
                                                        Info
                                                    </h4>
                                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                                        {
                                                            sidebarInfo.additionalInfo
                                                        }
                                                    </p>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center justify-between border-t p-4">
                                <DialogClose asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={handleCancel}
                                    >
                                        {cancelButtonText}
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={isLoading}
                                >
                                    {isLoading
                                        ? 'Loading...'
                                        : submitButtonText}
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 space-y-6 p-6 md:px-6 md:pt-6 md:pb-8">
                            {fields.map((field, index) => (
                                <div
                                    key={field.id}
                                    className={
                                        field.description ? '' : 'space-y-2'
                                    }
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="inline-flex size-6 items-center justify-center rounded-sm bg-muted text-sm text-foreground">
                                            {index + 1}
                                        </div>
                                        <Label
                                            htmlFor={field.id}
                                            className="text-sm font-medium text-foreground"
                                        >
                                            {field.label}
                                        </Label>
                                    </div>
                                    {field.description && (
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {field.description}
                                        </p>
                                    )}
                                    <Select
                                        value={values[field.id]}
                                        onValueChange={(value) =>
                                            handleValueChange(field.id, value)
                                        }
                                        defaultValue={field.defaultValue}
                                    >
                                        <SelectTrigger
                                            id={field.id}
                                            name={field.id}
                                            className={`w-full ${field.description ? 'mt-4' : ''}`}
                                        >
                                            <SelectValue
                                                placeholder={
                                                    field.placeholder ??
                                                    `Select ${field.label.toLowerCase()}`
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {field.options.map((option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
