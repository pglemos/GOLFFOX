"use client"

import { Toaster } from 'react-hot-toast';

export function ToasterProvider() {
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                className: 'glass-card !border-l-4 !rounded-lg !shadow-lg',
                style: {
                    background: 'var(--bg-elevated)',
                    color: 'var(--ink)',
                    padding: '16px',
                    backdropFilter: 'blur(8px)',
                },
                success: {
                    className: '!border-l-[var(--success)]',
                    iconTheme: {
                        primary: 'var(--success)',
                        secondary: 'white',
                    },
                },
                error: {
                    className: '!border-l-[var(--error)]',
                    iconTheme: {
                        primary: 'var(--error)',
                        secondary: 'white',
                    },
                },
                loading: {
                    className: '!border-l-[var(--brand)]',
                    iconTheme: {
                        primary: 'var(--brand)',
                        secondary: 'white',
                    },
                },
            }}
        />
    );
}
