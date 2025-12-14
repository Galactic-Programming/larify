import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardAction,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { type StatCardItem } from "@/types"

export interface SectionCardsProps {
    cards: StatCardItem[]
    className?: string
}

function StatCard({ card }: { card: StatCardItem }) {
    const TrendIcon = card.changeType === "up" ? IconTrendingUp : IconTrendingDown

    return (
        <Card className="@container/card">
            <CardHeader>
                <CardDescription>{card.title}</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {card.value}
                </CardTitle>
                <CardAction>
                    <Badge variant="outline">
                        <TrendIcon />
                        {card.change}
                    </Badge>
                </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                    {card.description} <TrendIcon className="size-4" />
                </div>
                <div className="text-muted-foreground">{card.footerNote}</div>
            </CardFooter>
        </Card>
    )
}

export function SectionCards({ cards, className }: SectionCardsProps) {
    return (
        <div
            className={`*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 ${className ?? ""}`}
        >
            {cards.map((card, index) => (
                <StatCard key={index} card={card} />
            ))}
        </div>
    )
}
