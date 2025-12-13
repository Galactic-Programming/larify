// Shadcn Studio - Reusable Components
// Export all components for easy importing

// Alert
export {
    AlertSoft,
    alertSoftVariants,
    type AlertSoftProps,
} from './alert-soft';

// Accordion
export {
    AccordionIconSubtitle,
    type AccordionIconSubtitleItem,
    type AccordionIconSubtitleProps,
} from './accordion-icon-subtitle';

// Avatar
export {
    AvatarStatus,
    avatarSizeVariants,
    statusIndicatorVariants,
    type AvatarStatusProps,
    type AvatarStatusType,
} from './avatar-status';

// Card
export {
    CardTopImage,
    type CardTopImageAction,
    type CardTopImageProps,
} from './card-top-image';

// Dialog
export {
    DialogInviteFriends,
    type DialogInviteFriendsProps,
    type InvitablePerson,
} from './dialog-invite-friends';

// Logo
export { default as Logo } from './logo';

// Radio Group
export {
    RadioGroupCard,
    type RadioCardOption,
    type RadioGroupCardProps,
} from './radio-group-card-radio';

// Toast (Soft Sonner)
export {
    softToast,
    softToastError,
    softToastInfo,
    softToastSuccess,
    softToastWarning,
    type SoftToastVariant,
} from './soft-sonner';

// Animated Tooltip
export {
    AnimatedTooltip,
    type AnimatedTooltipItem,
    type AnimatedTooltipProps,
} from './animated-tooltip';

// Animated Tabs (Motion Tabs)
export {
    AnimatedTabs,
    AnimatedTabsContent,
    AnimatedTabsContents,
    AnimatedTabsList,
    AnimatedTabsTrigger,
    useTabs,
    type AnimatedTabsContentProps,
    type AnimatedTabsContentsProps,
    type AnimatedTabsListProps,
    type AnimatedTabsProps,
    type AnimatedTabsTriggerProps,
} from './animated-tabs';

// Motion Highlight (internal use for motion components)
export {
    MotionHighlight,
    MotionHighlightItem,
    useMotionHighlight,
    type MotionHighlightItemProps,
    type MotionHighlightProps,
} from './motion-highlight';
