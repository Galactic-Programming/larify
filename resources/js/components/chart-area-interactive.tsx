"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    ToggleGroup,
    ToggleGroupItem,
} from "@/components/ui/toggle-group"
import {
    type ChartAreaConfig,
    type ChartDataPoint,
    type TimeRangeOption,
} from "@/types"

export interface ChartAreaInteractiveProps {
    data: ChartDataPoint[]
    areas: ChartAreaConfig[]
    title?: string
    description?: string
    referenceDate?: Date
    timeRanges?: TimeRangeOption[]
    defaultTimeRange?: string
    className?: string
}

const defaultTimeRanges: TimeRangeOption[] = [
    { value: "90d", label: "Last 3 months", days: 90 },
    { value: "30d", label: "Last 30 days", days: 30 },
    { value: "7d", label: "Last 7 days", days: 7 },
]

export function ChartAreaInteractive({
    data,
    areas,
    title = "Total Visitors",
    description,
    referenceDate = new Date(),
    timeRanges = defaultTimeRanges,
    defaultTimeRange = "90d",
    className,
}: ChartAreaInteractiveProps) {
    const isMobile = useIsMobile()
    const [timeRange, setTimeRange] = React.useState(defaultTimeRange)

    React.useEffect(() => {
        if (isMobile) {
            setTimeRange("7d")
        }
    }, [isMobile])

    const chartConfig = React.useMemo(() => {
        const config: ChartConfig = {
            visitors: { label: "Visitors" },
        }
        areas.forEach((area) => {
            config[area.dataKey] = {
                label: area.label,
                color: area.color,
            }
        })
        return config
    }, [areas])

    const filteredData = React.useMemo(() => {
        const selectedRange = timeRanges.find((r) => r.value === timeRange)
        const daysToSubtract = selectedRange?.days ?? 90

        return data.filter((item) => {
            const date = new Date(item.date)
            const startDate = new Date(referenceDate)
            startDate.setDate(startDate.getDate() - daysToSubtract)
            return date >= startDate
        })
    }, [data, timeRange, timeRanges, referenceDate])

    const currentRangeLabel = timeRanges.find((r) => r.value === timeRange)?.label ?? "Last 3 months"

    return (
        <Card className={`@container/card ${className ?? ""}`}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>
                    <span className="hidden @[540px]/card:block">
                        {description ?? `Total for the ${currentRangeLabel.toLowerCase()}`}
                    </span>
                    <span className="@[540px]/card:hidden">{currentRangeLabel}</span>
                </CardDescription>
                <CardAction>
                    <ToggleGroup
                        type="single"
                        value={timeRange}
                        onValueChange={setTimeRange}
                        variant="outline"
                        className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
                    >
                        {timeRanges.map((range) => (
                            <ToggleGroupItem key={range.value} value={range.value}>
                                {range.label}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger
                            className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
                            size="sm"
                            aria-label="Select a value"
                        >
                            <SelectValue placeholder={currentRangeLabel} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            {timeRanges.map((range) => (
                                <SelectItem key={range.value} value={range.value} className="rounded-lg">
                                    {range.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardAction>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[250px] w-full"
                >
                    <AreaChart data={filteredData}>
                        <defs>
                            {areas.map((area) => (
                                <linearGradient
                                    key={`fill-${area.dataKey}`}
                                    id={`fill-${area.dataKey}`}
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor={`var(--color-${area.dataKey})`}
                                        stopOpacity={area.fillOpacity ?? 1.0}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor={`var(--color-${area.dataKey})`}
                                        stopOpacity={0.1}
                                    />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={(value) => {
                                const date = new Date(value)
                                return date.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                })
                            }}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    labelFormatter={(value) => {
                                        return new Date(value).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                        })
                                    }}
                                    indicator="dot"
                                />
                            }
                        />
                        {areas.map((area) => (
                            <Area
                                key={area.dataKey}
                                dataKey={area.dataKey}
                                type="natural"
                                fill={`url(#fill-${area.dataKey})`}
                                stroke={`var(--color-${area.dataKey})`}
                                stackId="a"
                            />
                        ))}
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
