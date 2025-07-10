'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';
import ClientWrapper from './components/ClientWrapper';

function HomeContent() {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only redirect after component is mounted and auth is initialized
    if (mounted && initialized && !loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router, mounted, initialized]);

  // Show loading state until component is mounted and auth is initialized
  if (!mounted || !initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return null;
}

export default function Home() {
  return (
    <ClientWrapper>
      <HomeContent />
    </ClientWrapper>
  );
}
