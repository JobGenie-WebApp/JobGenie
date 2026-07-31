import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
    title: 'Employer Signup | JobGenie',
    description: 'Register your company and start hiring top talent',
};

export default async function EmployerSignupPage() {
    redirect('/signup?role=company');
}
