import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';

import { contactInfo } from '../data/constants';
// import { LazyImage } from './lazy-image';

export function ContactSection() {
    return (
        <section id="contact" className="bg-muted py-12 sm:py-16 lg:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="relative mx-auto mb-8 w-fit sm:mb-10 lg:mb-12">
                    <h2 className="text-2xl font-semibold md:text-3xl lg:text-4xl">
                        Get in Touch
                    </h2>
                    <span className="absolute top-9 left-0 h-px w-full bg-primary" />
                </div>

                <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
                    {/* Image */}
                    <div className="relative aspect-video overflow-hidden rounded-xl lg:aspect-square">
                        <img
                            src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&q=80"
                            alt="Team collaboration"
                            className="absolute inset-0 h-full w-full object-cover"
                            loading="lazy"
                        />
                    </div>

                    {/* Content */}
                    <div>
                        <h3 className="mb-4 text-xl font-semibold sm:mb-6 sm:text-2xl">
                            Happy to help you!
                        </h3>
                        <p className="mb-6 text-base font-medium text-muted-foreground sm:mb-10 sm:text-lg">
                            Have questions about Laraflow? Want to learn more
                            about our team plans? Or just want to say hello?
                            We're here for you.
                        </p>

                        {/* Contact Info Grid */}
                        <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
                            {contactInfo.map((info, index) => (
                                <Card
                                    key={index}
                                    className="h-full border-none shadow-none transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                                >
                                    <CardContent className="flex flex-row items-center gap-4 p-4 sm:flex-col sm:py-6 sm:text-center">
                                        <Avatar className="size-10 shrink-0 border sm:size-12">
                                            <AvatarFallback className="bg-primary/10 [&>svg]:size-5 sm:[&>svg]:size-6">
                                                <info.icon />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1 sm:w-full">
                                            <h4 className="text-sm font-semibold">
                                                {info.title}
                                            </h4>
                                            <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
                                                {info.description
                                                    .split('\n')
                                                    .map((line, idx) => (
                                                        <p key={idx}>{line}</p>
                                                    ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
