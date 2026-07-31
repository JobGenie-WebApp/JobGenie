import { redirect } from 'next/navigation';

export default function CandidateSignupPage() {
    redirect('/signup?role=candidate');
}
