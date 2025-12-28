import React from 'react';
import { motion, AnimatePresence, HTMLMotionProps, Variants } from 'framer-motion';

// Variants for staggered animations
export const staggerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

export const fadeInVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.25, 0, 1], // Custom cubic bezier for smooth effect
        },
    },
};

export const scaleInVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.3 }
    }
}

interface MotionProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}

export const MotionContainer: React.FC<MotionProps> = ({ children, className = '', ...props }) => {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerVariants}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export const MotionItem: React.FC<MotionProps> = ({ children, className = '', ...props }) => {
    return (
        <motion.div variants={fadeInVariants} className={className} {...props}>
            {children}
        </motion.div>
    );
};

// Component for smooth height transitions (Accordions, etc.)
export const SmoothHeight: React.FC<MotionProps & { isOpen: boolean }> = ({
    children,
    isOpen,
    className = ''
}) => {
    return (
        <AnimatePresence initial={false}>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className={`overflow-hidden ${className}`}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
