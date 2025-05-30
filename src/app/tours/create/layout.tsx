// src/app/tours/create/layout.tsx
import AuthGuard from '@/components/auth/AuthGuard';
import type { ReactNode } from 'react';

export default function CreateTourLayout({ children }: { children: ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
