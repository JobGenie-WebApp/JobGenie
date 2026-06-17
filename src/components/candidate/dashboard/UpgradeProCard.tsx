"use client";

import Link from "next/link";
import { Zap } from "lucide-react";

export function UpgradeProCard() {
    return (
        <div className="rounded-2xl overflow-hidden shadow-sm border border-primary/20">
            <div className="relative p-5"
                style={{ background: "linear-gradient(135deg, rgba(0,102,27,0.22) 0%, rgba(0,51,14,0.38) 100%)" }}>
                {/* Decorative glows */}
                <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full blur-xl"
                    style={{ background: "rgba(0,200,60,0.18)" }} />
                <div className="absolute bottom-0 left-0 h-14 w-14 rounded-full blur-xl"
                    style={{ background: "rgba(0,180,60,0.12)" }} />

                {/* Label */}
                <p className="relative text-[10px] font-bold tracking-widest text-primary mb-2 uppercase">
                    Upgrade to Pro
                </p>

                {/* Icon */}
                <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 border border-primary/30 mb-3">
                    <Zap className="h-4 w-4 text-primary" fill="currentColor" />
                </div>

                {/* Text */}
                <p className="relative text-xs text-foreground/70 leading-relaxed mb-4">
                    Get priority listing, direct recruiter messages, and analytics on your profile views.
                </p>

                {/* CTA */}
                <Link
                    href="/candidate/settings"
                    className="relative inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm shadow-primary/30"
                >
                    <Zap className="h-3.5 w-3.5" fill="currentColor" />
                    Upgrade Now
                </Link>
            </div>
        </div>
    );
}
