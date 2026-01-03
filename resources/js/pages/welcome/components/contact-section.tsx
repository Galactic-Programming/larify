import { motion } from 'motion/react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/ui/hover-card';

import { contactInfo } from '../data/constants';

export function ContactSection() {
    return (
        <section id="contact" className="bg-muted py-12 sm:py-16 lg:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.5 }}
                    className="relative mx-auto mb-8 w-fit sm:mb-10 lg:mb-12"
                >
                    <h2 className="text-2xl font-semibold md:text-3xl lg:text-4xl">
                        Get in Touch
                    </h2>
                    <motion.span
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="absolute top-9 left-0 h-px w-full origin-left bg-primary"
                    />
                </motion.div>

                <div className="grid items-center gap-12 lg:grid-cols-2">
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-50px' }}
                        transition={{ duration: 0.6 }}
                        whileHover={{ scale: 1.02 }}
                        className="flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-primary/10 lg:aspect-square"
                    >
                        <img
                            src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80"
                            alt="Team collaboration"
                            className="h-full w-full object-cover"
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-50px' }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <h3 className="mb-6 text-2xl font-semibold">
                            Happy to help you!
                        </h3>
                        <p className="mb-10 text-lg font-medium text-muted-foreground">
                            Have questions about Larify? Want to learn more
                            about our team plans? Or just want to say hello?
                            We're here for you.
                        </p>

                        {/* Contact Info Grid */}
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {contactInfo.map((info, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{
                                        delay: 0.3 + index * 0.1,
                                        duration: 0.4,
                                    }}
                                >
                                    <HoverCard openDelay={100} closeDelay={100}>
                                        <HoverCardTrigger asChild>
                                            <Card className="h-full cursor-pointer border-none shadow-none transition-all hover:-translate-y-1 hover:shadow-md">
                                                <CardContent className="flex flex-col items-center gap-4 py-6 text-center">
                                                    <Avatar className="size-12 border">
                                                        <AvatarFallback className="bg-primary/10 [&>svg]:size-6">
                                                            <info.icon />
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </CardContent>
                                            </Card>
                                        </HoverCardTrigger>
                                        <HoverCardContent
                                            className="w-72"
                                            side="top"
                                            align="center"
                                        >
                                            <div className="flex justify-between gap-4">
                                                <Avatar className="size-10">
                                                    <AvatarFallback className="bg-primary/10 [&>svg]:size-5">
                                                        <info.icon />
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 space-y-1">
                                                    <h4 className="text-sm font-semibold">
                                                        {info.title}
                                                    </h4>
                                                    <div className="text-sm text-muted-foreground">
                                                        {info.description
                                                            .split('\n')
                                                            .map(
                                                                (line, idx) => (
                                                                    <p
                                                                        key={
                                                                            idx
                                                                        }
                                                                    >
                                                                        {line}
                                                                    </p>
                                                                ),
                                                            )}
                                                    </div>
                                                </div>
                                            </div>
                                        </HoverCardContent>
                                    </HoverCard>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
