import { LucideIcon, PlusIcon } from 'lucide-react';

import * as AccordionPrimitive from '@radix-ui/react-accordion';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

export interface AccordionIconSubtitleItem {
    icon: LucideIcon;
    title: string;
    subtitle?: string;
    content: React.ReactNode;
}

export interface AccordionIconSubtitleProps {
    items: AccordionIconSubtitleItem[];
    defaultValue?: string;
    type?: 'single' | 'multiple';
    collapsible?: boolean;
    className?: string;
}

const AccordionIconSubtitle = ({
    items,
    defaultValue,
    type = 'single',
    collapsible = true,
    className,
}: AccordionIconSubtitleProps) => {
    const accordionProps =
        type === 'single'
            ? {
                  type: 'single' as const,
                  collapsible,
                  defaultValue:
                      defaultValue || (items.length > 0 ? 'item-1' : undefined),
              }
            : {
                  type: 'multiple' as const,
                  defaultValue: defaultValue ? [defaultValue] : undefined,
              };

    return (
        <Accordion {...accordionProps} className={cn('w-full', className)}>
            {items.map((item, index) => (
                <AccordionItem key={index} value={`item-${index + 1}`}>
                    <AccordionPrimitive.Header className="flex">
                        <AccordionPrimitive.Trigger
                            data-slot="accordion-trigger"
                            className="flex flex-1 items-center justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&>svg>path:last-child]:origin-center [&>svg>path:last-child]:transition-all [&>svg>path:last-child]:duration-200 [&[data-state=open]>svg]:rotate-180 [&[data-state=open]>svg>path:last-child]:rotate-90 [&[data-state=open]>svg>path:last-child]:opacity-0"
                        >
                            <span className="flex items-center gap-4">
                                <span
                                    className="flex size-10 shrink-0 items-center justify-center rounded-full border"
                                    aria-hidden="true"
                                >
                                    <item.icon className="size-4" />
                                </span>
                                <span className="flex flex-col space-y-0.5">
                                    <span>{item.title}</span>
                                    {item.subtitle && (
                                        <span className="font-normal text-muted-foreground">
                                            {item.subtitle}
                                        </span>
                                    )}
                                </span>
                            </span>
                            <PlusIcon className="pointer-events-none size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                        </AccordionPrimitive.Trigger>
                    </AccordionPrimitive.Header>
                    <AccordionContent className="text-muted-foreground">
                        {item.content}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
};

export { AccordionIconSubtitle };
export default AccordionIconSubtitle;
