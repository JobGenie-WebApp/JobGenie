import Image from "next/image";

import { cn } from "@/lib/utils";

type JobGenieLogoProps = {
    className?: string;
    imageClassName?: string;
    wordmarkClassName?: string;
    priority?: boolean;
    sizes?: string;
};

export function JobGenieLogo({
    className,
    imageClassName,
    wordmarkClassName,
    priority = false,
    sizes = "48px",
}: JobGenieLogoProps) {
    return (
        <span className={cn("inline-flex shrink-0 items-center gap-2.5", className)}>
            <Image
                src="/logoco.jpg"
                alt="JobGenie"
                width={1024}
                height={966}
                priority={priority}
                sizes={sizes}
                className={cn("h-10 w-auto object-contain rounded-xl", imageClassName)}
            />
            <span
                aria-hidden="true"
                className={cn(
                    "hidden whitespace-nowrap text-xl font-bold tracking-[-0.035em] text-foreground md:inline",
                    wordmarkClassName,
                )}
            >
                Job<span className="font-black text-primary">Genie</span>
            </span>
        </span>
    );
}
