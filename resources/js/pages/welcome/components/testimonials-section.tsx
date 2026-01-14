import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

import { testimonials } from '../data/constants';

export function TestimonialsSection() {
    return (
        <section id="testimonials" className="py-12 sm:py-16 lg:py-20">
            <Carousel
                className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:gap-10 sm:px-6 lg:gap-12 lg:px-8"
                opts={{
                    align: 'start',
                    slidesToScroll: 1,
                }}
            >
                {/* Left Content */}
                <div className="space-y-3 sm:w-1/2 sm:space-y-4 lg:w-1/3">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-primary uppercase">
                            Future Feature
                        </p>
                        <Badge variant="secondary" className="text-xs">
                            Coming Soon
                        </Badge>
                    </div>
                    <h2 className="text-2xl font-semibold sm:text-3xl lg:text-4xl">
                        What Our Users Say
                    </h2>
                    <p className="text-base text-muted-foreground sm:text-lg">
                        User reviews feature is coming soon. Share your
                        experience with Laraflow and help others discover it.
                    </p>
                    <div className="flex items-center gap-3 pt-2 sm:gap-4">
                        <CarouselPrevious
                            variant="default"
                            className="static translate-y-0 rounded-md disabled:bg-primary/10 disabled:text-primary disabled:opacity-100"
                        />
                        <CarouselNext
                            variant="default"
                            className="static translate-y-0 rounded-md disabled:bg-primary/10 disabled:text-primary disabled:opacity-100"
                        />
                    </div>
                </div>

                {/* Right Testimonial Carousel */}
                <div className="relative w-full sm:w-1/2 lg:w-2/3">
                    <CarouselContent className="-ml-4 sm:-ml-6">
                        {testimonials.map((testimonial, index) => (
                            <CarouselItem
                                key={index}
                                className="pl-4 sm:pl-6 md:basis-1/2"
                            >
                                <Card className="h-full transition-colors duration-200 hover:border-primary">
                                    <CardContent className="space-y-4 sm:space-y-5">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="size-10 rounded-full">
                                                <AvatarImage
                                                    src={testimonial.avatar}
                                                    alt={testimonial.name}
                                                    loading="lazy"
                                                />
                                                <AvatarFallback className="rounded-full text-sm">
                                                    {testimonial.name
                                                        .split(' ', 2)
                                                        .map((n) => n[0])
                                                        .join('')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="truncate font-medium">
                                                    {testimonial.name}
                                                </h4>
                                                <p className="truncate text-sm text-muted-foreground">
                                                    {testimonial.role} at{' '}
                                                    <span className="font-semibold text-card-foreground">
                                                        {testimonial.company}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-0.5">
                                            {Array.from({ length: 5 }).map(
                                                (_, i) => (
                                                    <svg
                                                        key={i}
                                                        className={cn(
                                                            'size-4 sm:size-5',
                                                            i <
                                                                testimonial.rating
                                                                ? 'text-yellow-400'
                                                                : 'text-gray-300',
                                                        )}
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                        aria-hidden="true"
                                                    >
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                ),
                                            )}
                                        </div>
                                        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                                            {testimonial.content}
                                        </p>
                                    </CardContent>
                                </Card>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </div>
            </Carousel>
        </section>
    );
}
