// src/app/tours/[id]/edit/layout.tsx
import AuthGuard from '@/components/auth/AuthGuard';
import type { ReactNode } from 'react';

export default function EditTourLayout({ children }: { children: ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
