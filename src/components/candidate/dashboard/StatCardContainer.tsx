interface StatCardContainerProps {
    children: React.ReactNode;
    className?: string;
}

export function StatCardContainer({ children, className }: StatCardContainerProps) {
    return <div className={className}>{children}</div>;
}
