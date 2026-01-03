import { motion } from 'motion/react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { features } from '../data/constants';

export function FeaturesSection() {
    return (
        <section id="features" className="py-12 sm:py-16 lg:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.6 }}
                    className="mb-8 space-y-3 sm:mb-10 lg:mb-12"
                >
                    <h2 className="text-2xl font-semibold md:text-3xl lg:text-4xl">
                        Everything You Need to Stay Productive
                    </h2>
                    <p className="max-w-3xl text-lg text-muted-foreground">
                        Powerful features designed to help you focus, organize,
                        and accomplish your goals with ease.
                    </p>
                </motion.div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{
                                delay: index * 0.1,
                                duration: 0.5,
                                ease: 'easeOut',
                            }}
                            whileHover={{
                                y: -8,
                                transition: { duration: 0.2 },
                            }}
                        >
                            <Card
                                className={cn(
                                    'group h-full shadow-none transition-all duration-300 hover:shadow-lg',
                                    feature.cardBorderColor,
                                )}
                            >
                                <CardContent>
                                    <Avatar
                                        className={cn(
                                            'mb-6 size-10 rounded-md text-foreground transition-colors duration-300',
                                            feature.hoverTextColor,
                                        )}
                                    >
                                        <AvatarFallback
                                            className={cn(
                                                'rounded-md bg-muted transition-colors duration-300 [&>svg]:size-6',
                                                feature.hoverBgColor,
                                            )}
                                        >
                                            <feature.icon />
                                        </AvatarFallback>
                                    </Avatar>
                                    <h6 className="mb-2 text-lg font-semibold">
                                        {feature.title}
                                    </h6>
                                    <p className="text-muted-foreground">
                                        {feature.description}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
