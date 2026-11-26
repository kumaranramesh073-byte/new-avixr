import * as React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

/* ════════════════════════════════════════════════════════════════════════
   Liquid-Glass primitives — the building blocks of the dark glass theme.
   ════════════════════════════════════════════════════════════════════════ */

type GlassCardProps = HTMLMotionProps<'div'> & {
    /** Lift + glow on hover */
    hover?: boolean;
    /** Stronger blur / opacity for hero surfaces */
    strong?: boolean;
    /** Accent glow color on hover */
    glow?: 'violet' | 'cyan' | 'pink' | 'none';
    /** Animated light sheen sweeping across the surface */
    shimmer?: boolean;
};

const glowMap: Record<string, string> = {
    violet: 'hover:shadow-glow-violet hover:border-neon-violet/40',
    cyan: 'hover:shadow-glow-cyan hover:border-neon-cyan/40',
    pink: 'hover:shadow-glow-pink hover:border-neon-pink/40',
    none: '',
};

/**
 * GlassCard — frosted translucent surface with a top edge highlight.
 */
export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
    ({ className, hover = false, strong = false, glow = 'none', shimmer = false, children, ...props }, ref) => (
        <motion.div
            ref={ref}
            className={cn(
                'glass-edge relative overflow-hidden rounded-2xl',
                strong ? 'glass-strong' : 'glass',
                shimmer && 'glass-shimmer',
                hover && 'transition-all duration-300 hover:-translate-y-0.5',
                hover && glowMap[glow],
                className,
            )}
            {...props}
        >
            {children}
        </motion.div>
    ),
);
GlassCard.displayName = 'GlassCard';

/**
 * GlassPanel — larger section container with an optional title row.
 */
export function GlassPanel({
    title,
    icon,
    action,
    className,
    bodyClassName,
    children,
}: {
    title?: React.ReactNode;
    icon?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
    bodyClassName?: string;
    children: React.ReactNode;
}) {
    return (
        <GlassCard className={className}>
            {(title || action) && (
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                    <div className="flex items-center gap-2.5">
                        {icon && <span className="text-neon-violet-bright">{icon}</span>}
                        {title && (
                            <h3 className="text-sm font-semibold tracking-tight text-foreground">
                                {title}
                            </h3>
                        )}
                    </div>
                    {action}
                </div>
            )}
            <div className={cn('p-5', bodyClassName)}>{children}</div>
        </GlassCard>
    );
}

type GlassButtonProps = HTMLMotionProps<'button'> & {
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
};

const sizeMap = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-5 text-sm',
    lg: 'h-12 px-7 text-[15px]',
};

/**
 * GlassButton — primary (violet gradient + glow), secondary (glass), ghost.
 */
export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
    ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
        const base =
            'inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-tight transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-violet disabled:opacity-45 disabled:pointer-events-none';
        const variants = {
            primary:
                'text-white bg-gradient-to-br from-neon-violet to-[#7C3AED] shadow-[0_4px_16px_rgba(139,92,246,0.35)] hover:shadow-[0_6px_24px_rgba(139,92,246,0.55)] hover:brightness-110',
            secondary:
                'text-foreground glass-subtle border border-white/10 hover:bg-white/[0.08] hover:border-white/20',
            ghost: 'text-muted-foreground hover:text-foreground hover:bg-white/[0.06]',
        };
        return (
            <motion.button
                ref={ref}
                whileTap={{ scale: 0.97 }}
                className={cn(base, sizeMap[size], variants[variant], className)}
                {...props}
            >
                {children}
            </motion.button>
        );
    },
);
GlassButton.displayName = 'GlassButton';
