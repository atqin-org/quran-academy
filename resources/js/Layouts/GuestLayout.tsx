import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="min-h-[100svh] flex flex-col items-center overflow-y-auto py-6 bg-center bg-[url('/background.jpg')] bg-cover sm:px-0 px-5">
            <div className="w-full max-w-md my-auto px-6 py-6 bg-white shadow-md rounded-lg">
                <Link href="/" className="flex justify-center mb-4">
                    <img
                        src="/images/athar-logo.svg"
                        alt="Athar Logo"
                        className="w-24 h-24"
                    />
                </Link>
                {children}
            </div>
        </div>
    );
}
