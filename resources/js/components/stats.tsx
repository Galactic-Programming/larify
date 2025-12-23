'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import { Area, AreaChart, XAxis } from 'recharts';

export interface StatItem {
    id: string;
    name: string;
    tickerSymbol?: string;
    value: string;
    change: string;
    percentageChange: string;
    changeType: 'positive' | 'negative';
}

export interface StatDataPoint {
    date: string;
    [key: string]: string | number;
}

export interface StatsProps {
    /** Summary items to display */
    items: StatItem[];
    /** Chart data points */
    data: StatDataPoint[];
    /** Number of columns */
    columns?: 1 | 2 | 3 | 4;
    /** Positive color (HSL format) */
    positiveColor?: string;
    /** Negative color (HSL format) */
    negativeColor?: string;
    /** Custom class name */
    className?: string;
    /** Chart height */
    chartHeight?: string;
}

const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

const sanitizeName = (name: string) => {
    return name
        .replace(/\\s+/g, '-')
        .replace(/[^a-zA-Z0-9-]/g, '_')
        .toLowerCase();
};

export default function Stats({
    items,
    data,
    columns = 3,
    positiveColor = 'hsl(142.1 76.2% 36.3%)',
    negativeColor = 'hsl(0 72.2% 50.6%)',
    className,
    chartHeight = 'h-16',
}: StatsProps) {
    return (
        <div
            className={cn(
                'flex w-full items-center justify-center p-10',
                className,
            )}
        >
            <dl className={cn('grid w-full gap-6', columnClasses[columns])}>
                {items.map((item) => {
                    const sanitizedName = sanitizeName(item.name);
                    const gradientId = `gradient-${sanitizedName}`;
                    const color =
                        item.changeType === 'positive'
                            ? positiveColor
                            : negativeColor;

                    return (
                        <Card key={item.id} className="p-0">
                            <CardContent className="p-4 pb-0">
                                <div>
                                    <dt className="text-sm font-medium text-foreground">
                                        {item.name}{' '}
                                        {item.tickerSymbol && (
                                            <span className="font-normal text-muted-foreground">
                                                ({item.tickerSymbol})
                                            </span>
                                        )}
                                    </dt>
                                    <div className="flex items-baseline justify-between">
                                        <dd
                                            className={cn(
                                                item.changeType === 'positive'
                                                    ? 'text-green-600 dark:text-green-500'
                                                    : 'text-red-600 dark:text-red-500',
                                                'text-lg font-semibold',
                                            )}
                                        >
                                            {item.value}
                                        </dd>
                                        <dd className="flex items-center space-x-1 text-sm">
                                            <span className="font-medium text-foreground">
                                                {item.change}
                                            </span>
                                            <span
                                                className={cn(
                                                    item.changeType ===
                                                        'positive'
                                                        ? 'text-green-600 dark:text-green-500'
                                                        : 'text-red-600 dark:text-red-500',
                                                )}
                                            >
                                                ({item.percentageChange})
                                            </span>
                                        </dd>
                                    </div>
                                </div>

                                <div
                                    className={cn(
                                        'mt-2 overflow-hidden',
                                        chartHeight,
                                    )}
                                >
                                    <ChartContainer
                                        className="h-full w-full"
                                        config={{
                                            [item.name]: {
                                                label: item.name,
                                                color: color,
                                            },
                                        }}
                                    >
                                        <AreaChart data={data}>
                                            <defs>
                                                <linearGradient
                                                    id={gradientId}
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="1"
                                                >
                                                    <stop
                                                        offset="5%"
                                                        stopColor={color}
                                                        stopOpacity={0.3}
                                                    />
                                                    <stop
                                                        offset="95%"
                                                        stopColor={color}
                                                        stopOpacity={0}
                                                    />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="date" hide={true} />
                                            <Area
                                                dataKey={item.name}
                                                stroke={color}
                                                fill={`url(#${gradientId})`}
                                                fillOpacity={0.4}
                                                strokeWidth={1.5}
                                                type="monotone"
                                            />
                                        </AreaChart>
                                    </ChartContainer>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </dl>
        </div>
    );
}
