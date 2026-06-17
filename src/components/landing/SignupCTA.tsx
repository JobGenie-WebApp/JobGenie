import Link from 'next/link';
import { ArrowRight, Users, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SignupCTA() {
    return (
        <section id="about" className="py-20 sm:py-28">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Candidate Card */}
                    <div className="group rounded-3xl border border-border bg-card p-8 transition-all hover:border-primary/50 sm:p-12">
                        <div className="mb-6 inline-flex items-center justify-center rounded-2xl bg-primary/10 p-4 text-primary">
                            <Users className="h-8 w-8" />
                        </div>

                        <h3 className="mb-4 text-2xl font-bold sm:text-3xl">
                            For Job Seekers
                        </h3>

                        <p className="mb-6 text-muted-foreground">
                            Create your profile, showcase your skills, and let employers come to you.
                            Access thousands of job opportunities from top companies.
                        </p>

                        <ul className="mb-8 space-y-3">
                            {[
                                'Free profile creation',
                                'AI-powered job recommendations',
                                'Track applications in one place',
                                'Get noticed by top employers',
                            ].map((item) => (
                                <li key={item} className="flex items-center gap-3 text-sm">
                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <Button asChild variant="gradient" size="lg" className="group/btn gap-2">
                            <Link href="/candidate/signup">
                                Get Started Free
                                <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                            </Link>
                        </Button>
                    </div>

                    {/* Employer Card */}
                    <div className="group rounded-3xl border border-border bg-card p-8 transition-all hover:border-primary/50 sm:p-12">
                        <div className="mb-6 inline-flex items-center justify-center rounded-2xl bg-primary/10 p-4 text-primary">
                            <Building2 className="h-8 w-8" />
                        </div>

                        <h3 className="mb-4 text-2xl font-bold sm:text-3xl">
                            For Employers
                        </h3>

                        <p className="mb-6 text-muted-foreground">
                            Find the perfect candidates for your team. Post jobs, search our talent pool,
                            and connect with qualified professionals instantly.
                        </p>

                        <ul className="mb-8 space-y-3">
                            {[
                                'Post unlimited job listings',
                                'Access verified talent pool',
                                'Advanced candidate filtering',
                                'Streamlined recruitment workflow',
                            ].map((item) => (
                                <li key={item} className="flex items-center gap-3 text-sm">
                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <Button asChild variant="gradient" size="lg" className="group/btn gap-2">
                            <Link href="/employer/signup">
                                Start Hiring
                                <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
