import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth/auth-form';

/** docs/02-APP-FLOW.md §2.2 — Signup. */
export const metadata: Metadata = {
  title: 'Create your account · Anera',
};

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
