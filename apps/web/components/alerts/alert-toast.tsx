"use client"

import { AlertTriangle, X } from "lucide-react"
import { toast } from "react-hot-toast"
import { motion } from "framer-motion"

interface AlertToastProps {
    t: any
    title: string
    message: string
    severity: 'critical' | 'warning' | 'info'
    onDismiss: () => void
}

export function AlertToast({ t, title, message, severity, onDismiss }: AlertToastProps) {
    const getColors = () => {
        switch (severity) {
            case 'critical':
                return 'bg-error-light0 border-red-600' // Darker red/white
            case 'warning':
                return 'bg-amber-500 border-amber-600'
            case 'info':
                return 'bg-info-light0 border-info'
            default:
                return 'bg-slate-800 border-slate-700'
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`${t.visible ? 'animate-enter' : 'animate-leave'} 
        max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden border-l-4 ${getColors().split(' ')[1]}`} // Border color logic needs adjustment for custom borders, using standard classes for now.
        >
            {/* Custom implementation for nicer look */}
            <div className={`flex-1 w-0 p-4`}>
                <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                        <div className={`rounded-full p-2 ${severity === 'critical' ? 'bg-error-light' :
                                severity === 'warning' ? 'bg-amber-100' : 'bg-info-light'
                            }`}>
                            <AlertTriangle className={`h-6 w-6 ${severity === 'critical' ? 'text-error' :
                                    severity === 'warning' ? 'text-amber-600' : 'text-info'
                                }`} />
                        </div>
                    </div>
                    <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-ink-strong">
                            {title}
                        </p>
                        <p className="mt-1 text-sm text-ink-muted">
                            {message}
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex border-l border-border-light">
                <button
                    onClick={() => {
                        toast.dismiss(t.id)
                        onDismiss()
                    }}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    Fechar
                </button>
            </div>
        </motion.div>
    )
}

// Helper to trigger custom alert
export const showCriticalAlert = (title: string, message: string) => {
    toast.custom((t) => (
        <AlertToast
            t={t}
            title={title}
            message={message}
            severity="critical"
            onDismiss={() => { }}
        />
    ), {
        duration: 8000, // Longer duration for critical alerts
        position: 'top-right'
    })
}
