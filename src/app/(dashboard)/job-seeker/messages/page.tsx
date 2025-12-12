'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function JobSeekerMessagesRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/messages');
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <p className="text-gray-500">Redirecting to messages...</p>
        </div>
    );
}
