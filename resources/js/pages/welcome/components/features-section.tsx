import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { features } from '../data/constants';

export function FeaturesSection() {
    return (
        <section id="features" className="py-12 sm:py-16 lg:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8 space-y-3 sm:mb-10 lg:mb-12">
                    <h2 className="text-2xl font-semibold md:text-3xl lg:text-4xl">
                        Everything You Need to Stay Productive
                    </h2>
                    <p className="max-w-3xl text-base text-muted-foreground sm:text-lg">
                        Powerful features designed to help you focus, organize,
                        and accomplish your goals with ease.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                    {features.map((feature, index) => (
                        <Card
                            key={index}
                            className={cn(
                                'group h-full shadow-none transition-all duration-200 hover:-translate-y-1 hover:shadow-lg',
                                feature.cardBorderColor,
                            )}
                        >
                            <CardContent>
                                <Avatar
                                    className={cn(
                                        'mb-4 size-10 rounded-md text-foreground transition-colors duration-200 sm:mb-6',
                                        feature.hoverTextColor,
                                    )}
                                >
                                    <AvatarFallback
                                        className={cn(
                                            'rounded-md bg-muted transition-colors duration-200 [&>svg]:size-5 sm:[&>svg]:size-6',
                                            feature.hoverBgColor,
                                        )}
                                    >
                                        <feature.icon />
                                    </AvatarFallback>
                                </Avatar>
                                <h6 className="mb-2 text-base font-semibold sm:text-lg">
                                    {feature.title}
                                </h6>
                                <p className="text-sm text-muted-foreground sm:text-base">
                                    {feature.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
