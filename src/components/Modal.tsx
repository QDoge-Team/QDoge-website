import { useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
    isOpen: boolean;
    children: React.ReactNode;
    onClose: () => void;
    className?: string;
}

export default function Modal({ isOpen, children, onClose, className }: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Prevent all events from propagating through the modal
    useEffect(() => {
        if (!isOpen) return;

        const handleGlobalClick = (e: MouseEvent) => {
            // If click is inside the overlay but outside the content, close modal
            if (overlayRef.current && contentRef.current) {
                const isInsideOverlay = overlayRef.current.contains(e.target as Node);
                const isInsideContent = contentRef.current.contains(e.target as Node);
                
                if (isInsideOverlay && !isInsideContent) {
                    // Clicked on backdrop - close modal and stop event
                    onClose();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                }
                // If inside content, let the event proceed naturally to buttons
            }
        };

        const handleGlobalMouseDown = (e: MouseEvent) => {
            if (overlayRef.current && contentRef.current) {
                const isInsideOverlay = overlayRef.current.contains(e.target as Node);
                const isInsideContent = contentRef.current.contains(e.target as Node);
                
                // Only stop propagation if clicking on backdrop, not content
                if (isInsideOverlay && !isInsideContent) {
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                }
            }
        };

        const handleGlobalPointerDown = (e: PointerEvent) => {
            if (overlayRef.current && contentRef.current) {
                const isInsideOverlay = overlayRef.current.contains(e.target as Node);
                const isInsideContent = contentRef.current.contains(e.target as Node);
                
                // Only stop propagation if clicking on backdrop, not content
                if (isInsideOverlay && !isInsideContent) {
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                }
            }
        };

        // Use capture phase to intercept events before they reach other handlers
        document.addEventListener('click', handleGlobalClick, true);
        document.addEventListener('mousedown', handleGlobalMouseDown, true);
        document.addEventListener('pointerdown', handleGlobalPointerDown, true);

        return () => {
            document.removeEventListener('click', handleGlobalClick, true);
            document.removeEventListener('mousedown', handleGlobalMouseDown, true);
            document.removeEventListener('pointerdown', handleGlobalPointerDown, true);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const modalContent = (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-[2147483647] bg-black/50 flex items-center justify-center"
            style={{ isolation: 'isolate' }}
        >
            <div
                ref={contentRef}
                className={`relative z-[2147483647] bg-white w-[400px] max-w-[90vw] rounded-lg shadow-2xl ${className || ''}`}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );

    // Use portal to render modal at the top level of the DOM
    if (typeof document !== 'undefined') {
        return createPortal(modalContent, document.body);
    }

    return modalContent;
}
