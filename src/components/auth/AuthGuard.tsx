// src/components/auth/AuthGuard.tsx
"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import type { ReactNode} from 'react';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      // Store the intended path to redirect after login
      const loginUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      router.push(loginUrl);
    }
  }, [user, loading, router, pathname]);

  if (loading || !user) {
    // Show a loading state or skeleton while checking auth or redirecting
    return (
       <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <Skeleton className="h-12 w-1/2 mb-4" />
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-8 w-3/4 mb-6" />
        <Skeleton className="h-64 w-full max-w-md" />
      </div>
    );
  }

  return <>{children}</>;
}
