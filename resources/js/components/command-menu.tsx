"use client";

import { type ReactNode, useCallback, useEffect, useState } from "react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

export interface CommandMenuItem {
    id: string;
    label: ReactNode;
    icon?: ReactNode;
    shortcut?: string[];
    onSelect?: () => void;
    disabled?: boolean;
}

export interface CommandMenuGroup {
    heading?: string;
    items: CommandMenuItem[];
}

export interface CommandMenuProps {
    /** Controlled open state */
    open?: boolean;
    /** Default open state for uncontrolled mode */
    defaultOpen?: boolean;
    /** Callback when open state changes */
    onOpenChange?: (open: boolean) => void;
    /** Menu groups with items */
    groups: CommandMenuGroup[];
    /** Placeholder text for search input */
    placeholder?: string;
    /** Empty state message */
    emptyMessage?: string;
    /** Dialog title for accessibility */
    title?: string;
    /** Dialog description for accessibility */
    description?: string;
    /** Enable keyboard shortcut (Ctrl/Cmd + K) */
    enableKeyboardShortcut?: boolean;
    /** Custom keyboard shortcut key (default: "k") */
    shortcutKey?: string;
    /** Callback when an item is selected */
    onItemSelect?: (item: CommandMenuItem) => void;
    /** Custom class name for dialog content */
    className?: string;
}

export function CommandMenu({
    open: controlledOpen,
    defaultOpen = false,
    onOpenChange,
    groups,
    placeholder = "What do you need?",
    emptyMessage = "No results found.",
    title = "Command Menu",
    description = "Use the command menu to navigate through the app.",
    enableKeyboardShortcut = true,
    shortcutKey = "k",
    onItemSelect,
    className,
}: CommandMenuProps) {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const [inputValue, setInputValue] = useState("");

    const isControlled = controlledOpen !== undefined;
    const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

    const setOpen = useCallback(
        (value: boolean | ((prev: boolean) => boolean)) => {
            const newValue = typeof value === "function" ? value(isOpen) : value;
            if (!isControlled) {
                setUncontrolledOpen(newValue);
            }
            onOpenChange?.(newValue);
        },
        [isControlled, isOpen, onOpenChange]
    );

    useEffect(() => {
        if (!enableKeyboardShortcut) return;

        const down = (e: KeyboardEvent) => {
            if (e.key === shortcutKey && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [enableKeyboardShortcut, shortcutKey, setOpen]);

    const handleSelect = useCallback(
        (item: CommandMenuItem) => {
            item.onSelect?.();
            onItemSelect?.(item);
            setOpen(false);
        },
        [onItemSelect, setOpen]
    );

    return (
        <Dialog onOpenChange={setOpen} open={isOpen}>
            <DialogHeader className="sr-only">
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <DialogContent
                className={`gap-0 overflow-hidden rounded-xl border-border/50 p-0 shadow-lg sm:max-w-lg ${className ?? ""}`}
                showCloseButton={false}
            >
                <Command className="flex h-full w-full flex-col overflow-hidden bg-popover **:data-[slot=command-input-wrapper]:h-auto **:data-[slot=command-input-wrapper]:grow **:data-[slot=command-input-wrapper]:border-0 **:data-[slot=command-input-wrapper]:px-0">
                    <div className="flex h-12 items-center gap-2 border-border/50 border-b px-4">
                        <CommandInput
                            className="h-10 text-[15px]"
                            onValueChange={setInputValue}
                            placeholder={placeholder}
                            value={inputValue}
                        />
                        <button
                            className="flex shrink-0 items-center"
                            onClick={() => setOpen(false)}
                            type="button"
                        >
                            <Kbd>Esc</Kbd>
                        </button>
                    </div>

                    <CommandList className="max-h-100 py-2">
                        <CommandEmpty>{emptyMessage}</CommandEmpty>

                        {groups.map((group, groupIndex) => (
                            <CommandGroup
                                key={group.heading ?? `group-${groupIndex}`}
                                heading={group.heading}
                            >
                                {group.items.map((item) => (
                                    <CommandItem
                                        key={item.id}
                                        className="mx-2 rounded-lg py-2.5"
                                        onSelect={() => handleSelect(item)}
                                        disabled={item.disabled}
                                    >
                                        {item.icon}
                                        {typeof item.label === "string" ? (
                                            <span>{item.label}</span>
                                        ) : (
                                            item.label
                                        )}
                                        {item.shortcut && item.shortcut.length > 0 && (
                                            <KbdGroup className="ml-auto">
                                                {item.shortcut.map((key, index) => (
                                                    <Kbd key={index}>{key}</Kbd>
                                                ))}
                                            </KbdGroup>
                                        )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ))}
                    </CommandList>
                </Command>
            </DialogContent>
        </Dialog>
    );
}
