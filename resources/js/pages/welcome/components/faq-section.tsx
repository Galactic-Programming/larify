import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';

import { faqItems } from '../data/constants';

export function FAQSection() {
    return (
        <section id="faq" className="bg-muted/50 py-12 sm:py-16 lg:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* FAQ Header */}
                <div className="mb-8 space-y-3 text-center sm:mb-10 lg:mb-12">
                    <h2 className="text-2xl font-semibold md:text-3xl lg:text-4xl">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-base text-muted-foreground sm:text-lg">
                        Everything you need to know about Laraflow. Can't find
                        what you're looking for? Contact us.
                    </p>
                </div>

                <div className="mx-auto max-w-3xl">
                    <Accordion
                        type="single"
                        collapsible
                        className="w-full"
                        defaultValue="item-1"
                    >
                        {faqItems.map((item, index) => (
                            <AccordionItem
                                key={index}
                                value={`item-${index + 1}`}
                            >
                                <AccordionTrigger className="text-left text-base sm:text-lg">
                                    {item.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                                    {item.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </section>
    );
}
