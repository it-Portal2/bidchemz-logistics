import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
}

export default function Skeleton({
    className = '',
    variant = 'text',
    width,
    height
}: SkeletonProps) {
    const baseClasses = "animate-pulse bg-gray-200 rounded";

    const variantClasses = {
        text: "h-4 w-full",
        circular: "rounded-full",
        rectangular: "h-full w-full",
    };

    const style = {
        width: width,
        height: height,
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
            role="status"
            aria-label="Loading..."
        />
    );
}

export function SkeletonCard() {
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4 animate-pulse" />
            <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
            </div>
        </div>
    );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number, cols?: number }) {
    return (
        <div className="w-full">
            <div className="flex space-x-4 mb-4 border-b pb-2">
                {Array.from({ length: cols }).map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
                ))}
            </div>
            <div className="space-y-4">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="flex space-x-4">
                        {Array.from({ length: cols }).map((_, j) => (
                            <div key={j} className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
