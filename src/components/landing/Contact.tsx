'use client';

import { Mail, MapPin, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    fadeUp,
    inViewProps,
    staggerFast,
} from '@/lib/motion/landing';
import { LandingWatermarks } from '@/components/landing/LandingWatermarks';

const channels = [
    {
        icon: Mail,
        title: 'Email',
        detail: 'support@jobgenie.com',
        href: 'mailto:support@jobgenie.com',
        hint: 'Response within one business day.',
    },
    {
        icon: Phone,
        title: 'Phone',
        detail: '+1 (555) 123-4567',
        href: 'tel:+15551234567',
        hint: 'Weekdays 9am–6pm PT.',
    },
    {
        icon: MapPin,
        title: 'HQ',
        detail: 'San Francisco, CA',
        href: '#contact',
        hint: 'Global remote-first teams.',
    },
];

export function Contact() {
    return (
        <section
            id="contact"
            className="relative overflow-hidden border-t border-border/50 bg-muted/25 py-16 dark:bg-muted/10 sm:py-24"
        >
            <LandingWatermarks variant="contact" />
            <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
                <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 lg:items-start">
                    <motion.div
                        className="lg:col-span-5 lg:sticky lg:top-28"
                        {...inViewProps}
                        variants={staggerFast}
                    >
                        <motion.p
                            variants={fadeUp}
                            className="text-xs font-semibold uppercase tracking-[0.2em] text-primary"
                        >
                            Contact
                        </motion.p>
                        <motion.h2
                            variants={fadeUp}
                            className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
                        >
                            Let&apos;s scope your rollout.
                        </motion.h2>
                        <motion.p
                            variants={fadeUp}
                            className="mt-5 text-base leading-relaxed text-muted-foreground"
                        >
                            Whether you are mobilizing a hiring sprint or onboarding an entire talent
                            organization — tell us what success looks like.
                        </motion.p>

                        <motion.ul className="mt-10 space-y-6" variants={fadeUp}>
                            {channels.map((c) => (
                                <li key={c.title}>
                                    <motion.a
                                        href={c.href}
                                        className="group flex gap-4 rounded-2xl border border-transparent p-3 transition-colors hover:border-border hover:bg-muted/40"
                                        whileHover={{ x: 4 }}
                                        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                                    >
                                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-colors group-hover:border-primary/40">
                                            <c.icon className="h-5 w-5" strokeWidth={1.75} />
                                        </span>
                                        <span>
                                            <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                {c.title}
                                            </span>
                                            <span className="mt-0.5 block text-base font-semibold text-foreground">
                                                {c.detail}
                                            </span>
                                            <span className="mt-1 block text-sm text-muted-foreground">
                                                {c.hint}
                                            </span>
                                        </span>
                                    </motion.a>
                                </li>
                            ))}
                        </motion.ul>
                    </motion.div>

                    <motion.div
                        className="lg:col-span-7"
                        initial={{ opacity: 0, x: 28 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-60px' }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
                    >
                        <motion.div
                            className="rounded-3xl border border-border/80 bg-card p-6 shadow-xl shadow-foreground/[0.03] dark:shadow-black/40 sm:p-10"
                            whileHover={{
                                boxShadow:
                                    '0 24px 50px -28px color-mix(in oklch, var(--foreground) 15%, transparent)',
                            }}
                            transition={{ duration: 0.35 }}
                        >
                            <h3 className="text-lg font-semibold text-foreground">Send a brief</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                This form is presented for layout parity — wire your handler when API is
                                ready.
                            </p>
                            <form className="mt-8 space-y-6">
                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="contact-name">Name</Label>
                                        <Input
                                            id="contact-name"
                                            name="name"
                                            placeholder="Jordan Lee"
                                            autoComplete="name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contact-email">Work email</Label>
                                        <Input
                                            id="contact-email"
                                            name="email"
                                            type="email"
                                            placeholder="you@company.com"
                                            autoComplete="email"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contact-message">How can we help?</Label>
                                    <Textarea
                                        id="contact-message"
                                        name="message"
                                        rows={5}
                                        placeholder="Teams, regions, compliance needs, timelines…"
                                        className="resize-none"
                                    />
                                </div>
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="inline-block w-full sm:w-auto"
                                >
                                    <Button
                                        type="submit"
                                        size="lg"
                                        className="h-12 w-full rounded-full text-base shadow-lg shadow-primary/15 sm:w-auto sm:px-12"
                                    >
                                        Submit inquiry
                                    </Button>
                                </motion.div>
                            </form>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
