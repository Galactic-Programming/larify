import type { Variants } from 'motion/react';

/**
 * Shared animation variants for consistent motion across the app.
 * These variants can be reused in any component that uses motion/react.
 */

// =============================================================================
// Container Variants (for parent elements with staggered children)
// =============================================================================

/**
 * Standard staggered container - children appear with delay
 * Supports both "visible" and "show" as animate state for flexibility
 */
export const staggerContainer: Variants = {
    hidden: { opacity: 1 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
        },
    },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
        },
    },
};

/**
 * Fast staggered container - quicker succession
 */
export const staggerContainerFast: Variants = {
    hidden: { opacity: 1 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.05,
        },
    },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.05,
        },
    },
};

// =============================================================================
// Fade Variants
// =============================================================================

/**
 * Simple fade in/out
 */
export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.4 },
    },
    show: {
        opacity: 1,
        transition: { duration: 0.4 },
    },
};

/**
 * Fade with slide from bottom
 */
export const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15,
        },
    },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15,
        },
    },
};

/**
 * Fade with slide from top
 */
export const fadeInDown: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15,
        },
    },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15,
        },
    },
};

/**
 * Fade with slide from left
 */
export const fadeInLeft: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15,
        },
    },
    show: {
        opacity: 1,
        x: 0,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15,
        },
    },
};

/**
 * Fade with slide from right
 */
export const fadeInRight: Variants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15,
        },
    },
    show: {
        opacity: 1,
        x: 0,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15,
        },
    },
};

// =============================================================================
// Scale Variants
// =============================================================================

/**
 * Scale up from smaller size
 */
export const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15,
        },
    },
    show: {
        opacity: 1,
        scale: 1,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15,
        },
    },
};

/**
 * Scale with rotation (for icons)
 */
export const scaleRotate: Variants = {
    hidden: { opacity: 0, scale: 0, rotate: -180 },
    visible: {
        opacity: 1,
        scale: 1,
        rotate: 0,
        transition: {
            type: 'spring',
            stiffness: 200,
            damping: 15,
        },
    },
    show: {
        opacity: 1,
        scale: 1,
        rotate: 0,
        transition: {
            type: 'spring',
            stiffness: 200,
            damping: 15,
        },
    },
};

// =============================================================================
// Card/Item Variants (commonly used for list items, cards)
// =============================================================================

/**
 * Card entrance animation
 */
export const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15,
        },
    },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15,
        },
    },
};

/**
 * List item animation (slide from left)
 */
export const listItemVariants: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15,
        },
    },
    show: {
        opacity: 1,
        x: 0,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15,
        },
    },
};

// =============================================================================
// Page/Section Variants
// =============================================================================

/**
 * Page header animation
 */
export const pageHeaderVariants: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: 'easeOut',
        },
    },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: 'easeOut',
        },
    },
};

/**
 * Section/Content area animation
 */
export const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: 'easeOut',
        },
    },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: 'easeOut',
        },
    },
};

// =============================================================================
// Form Variants
// =============================================================================

/**
 * Form container with staggered fields
 */
export const formContainer: Variants = {
    hidden: { opacity: 1 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1,
        },
    },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1,
        },
    },
};

/**
 * Form field animation
 */
export const formField: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 12,
        },
    },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 12,
        },
    },
};

// =============================================================================
// Hover/Tap Animations (use with whileHover/whileTap)
// =============================================================================

export const hoverLift = {
    y: -4,
    transition: { duration: 0.2 },
};

export const hoverScale = {
    scale: 1.02,
    transition: { duration: 0.2 },
};

export const tapScale = {
    scale: 0.98,
};

export const buttonHover = {
    scale: 1.02,
    y: -2,
    transition: { duration: 0.2 },
};

export const buttonTap = {
    scale: 0.98,
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Create a stagger container with custom timing
 */
export function createStaggerContainer(
    staggerChildren: number = 0.1,
    delayChildren: number = 0.1,
): Variants {
    const transition = {
        staggerChildren,
        delayChildren,
    };
    return {
        hidden: { opacity: 1 },
        visible: {
            opacity: 1,
            transition,
        },
        show: {
            opacity: 1,
            transition,
        },
    };
}

/**
 * Create a fade-in variant with custom direction and distance
 */
export function createFadeIn(
    direction: 'up' | 'down' | 'left' | 'right' = 'up',
    distance: number = 20,
): Variants {
    const transition = {
        type: 'spring' as const,
        stiffness: 100,
        damping: 15,
    };

    const isVertical = direction === 'up' || direction === 'down';
    const value =
        direction === 'up' || direction === 'left' ? distance : -distance;

    if (isVertical) {
        return {
            hidden: { opacity: 0, y: value },
            visible: { opacity: 1, y: 0, transition },
            show: { opacity: 1, y: 0, transition },
        };
    }

    return {
        hidden: { opacity: 0, x: value },
        visible: { opacity: 1, x: 0, transition },
        show: { opacity: 1, x: 0, transition },
    };
}
