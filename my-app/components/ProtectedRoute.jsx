'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const ProtectedRoute = ({ children, role }) => {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');

    if (!token || (role && userRole !== role)) {
      router.push('/login');
    } else {
      setIsAuthorized(true);
    }
  }, [router, role]);

  if (!isAuthorized) return null;
  return children;
};

export default ProtectedRoute;
