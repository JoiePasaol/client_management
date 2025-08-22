    // src/components/ui/Dialog.tsx
    import React from "react";
    import { motion, AnimatePresence } from "framer-motion";
    import { X } from "lucide-react";
    import { Button } from "./Button";

    interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    showCloseButton?: boolean;
    }

    export function Dialog({
    isOpen,
    onClose,
    title,
    children,
    showCloseButton = true,
    }: DialogProps) {
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
            onClose();
        }
        };

        if (isOpen) {
        document.addEventListener("keydown", handleEscape);
        document.body.style.overflow = "hidden";
        }

        return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
        {isOpen && (
            <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Dialog */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-md mx-auto"
                >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <h2 className="text-xl font-semibold text-white">{title}</h2>
                    {showCloseButton && (
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-300 transition-colors p-1"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-6">{children}</div>
                </motion.div>
            </div>
            </>
        )}
        </AnimatePresence>
    );
    }

    // Confirmation Dialog Component
    interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
    variant?: "danger" | "warning" | "info";
    }

    export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Yes",
    cancelText = "No",
    isLoading = false,
    variant = "danger",
    }: ConfirmDialogProps) {
    const getVariantStyles = () => {
        switch (variant) {
        case "danger":
            return "bg-red-600 hover:bg-red-700 focus:ring-red-500";
        case "warning":
            return "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500";
        case "info":
            return "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500";
        default:
            return "bg-red-600 hover:bg-red-700 focus:ring-red-500";
        }
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title={title} showCloseButton={false}>
        <div className="space-y-4">
            <p className="text-gray-300 text-sm leading-relaxed">{message}</p>

            <div className="flex space-x-3 pt-4">
            <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
            >
                {cancelText}
            </Button>
            <Button
                type="button"
                onClick={onConfirm}
                loading={isLoading}
                disabled={isLoading}
                className={`flex-1 ${getVariantStyles()}`}
            >
                {isLoading ? "Processing..." : confirmText}
            </Button>
            </div>
        </div>
        </Dialog>
    );
    }

    // Success Dialog Component
    interface SuccessDialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    buttonText?: string;
    }

    export function SuccessDialog({
    isOpen,
    onClose,
    title,
    message,
    buttonText = "OK",
    }: SuccessDialogProps) {
    return (
        <Dialog isOpen={isOpen} onClose={onClose} title={title} showCloseButton={false}>
        <div className="space-y-4 text-center">
            {/* Success Icon */}
            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
                />
            </svg>
            </div>

            <p className="text-gray-300 text-sm leading-relaxed">{message}</p>

            <div className="pt-4">
            <Button
                type="button"
                onClick={onClose}
                className="w-full bg-green-600 hover:bg-green-700 focus:ring-green-500"
            >
                {buttonText}
            </Button>
            </div>
        </div>
        </Dialog>
    );
    }