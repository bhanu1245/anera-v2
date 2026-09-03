import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth/auth-form';

/** docs/02-APP-FLOW.md §2.3 — Login. */
export const metadata: Metadata = {
  title: 'Sign in · Anera',
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
