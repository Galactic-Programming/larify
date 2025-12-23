import { ExternalToast, toast } from 'sonner';

export type SoftToastVariant = 'info' | 'success' | 'warning' | 'error';

const variantStyles: Record<SoftToastVariant, React.CSSProperties> = {
    info: {
        '--normal-bg':
            'color-mix(in oklab, light-dark(var(--color-sky-600), var(--color-sky-400)) 10%, var(--background))',
        '--normal-text':
            'light-dark(var(--color-sky-600), var(--color-sky-400))',
        '--normal-border':
            'light-dark(var(--color-sky-600), var(--color-sky-400))',
    } as React.CSSProperties,
    success: {
        '--normal-bg':
            'color-mix(in oklab, light-dark(var(--color-green-600), var(--color-green-400)) 10%, var(--background))',
        '--normal-text':
            'light-dark(var(--color-green-600), var(--color-green-400))',
        '--normal-border':
            'light-dark(var(--color-green-600), var(--color-green-400))',
    } as React.CSSProperties,
    warning: {
        '--normal-bg':
            'color-mix(in oklab, light-dark(var(--color-amber-600), var(--color-amber-400)) 10%, var(--background))',
        '--normal-text':
            'light-dark(var(--color-amber-600), var(--color-amber-400))',
        '--normal-border':
            'light-dark(var(--color-amber-600), var(--color-amber-400))',
    } as React.CSSProperties,
    error: {
        '--normal-bg':
            'color-mix(in oklab, var(--destructive) 10%, var(--background))',
        '--normal-text': 'var(--destructive)',
        '--normal-border': 'var(--destructive)',
    } as React.CSSProperties,
};

/**
 * Show a soft-styled toast notification
 * @param variant - The toast variant: 'info', 'success', 'warning', or 'error'
 * @param message - The message to display
 * @param options - Additional sonner toast options
 */
export const softToast = (
    variant: SoftToastVariant,
    message: string,
    options?: ExternalToast,
) => {
    const style = variantStyles[variant];
    const mergedOptions: ExternalToast = {
        ...options,
        style: { ...style, ...options?.style },
    };

    switch (variant) {
        case 'info':
            return toast.info(message, mergedOptions);
        case 'success':
            return toast.success(message, mergedOptions);
        case 'warning':
            return toast.warning(message, mergedOptions);
        case 'error':
            return toast.error(message, mergedOptions);
    }
};

// Convenience methods for each variant
export const softToastInfo = (message: string, options?: ExternalToast) =>
    softToast('info', message, options);

export const softToastSuccess = (message: string, options?: ExternalToast) =>
    softToast('success', message, options);

export const softToastWarning = (message: string, options?: ExternalToast) =>
    softToast('warning', message, options);

export const softToastError = (message: string, options?: ExternalToast) =>
    softToast('error', message, options);
