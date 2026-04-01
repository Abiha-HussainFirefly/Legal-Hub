'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';
export type ToastPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  showIcon?: boolean;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  position: ToastPosition;
  addToast: (type: ToastType, title: string, message?: string, showIcon?: boolean, duration?: number) => string;
  removeToast: (id: string) => void;
  setPosition: (position: ToastPosition) => void;
  addLoadingWithSuccess: (loadingTitle: string, loadingMessage: string, successTitle: string, successMessage: string, loadingDuration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [position, setPosition] = useState<ToastPosition>('bottom-right');
  const nextIdRef = useRef(0);

  const addToast = useCallback((type: ToastType, title: string, message?: string, showIcon: boolean = true, duration: number = 5000) => {
    const id = `${Date.now()}-${nextIdRef.current++}`;
    const newToast: ToastItem = {
      id,
      type,
      title,
      message,
      showIcon,
      duration,
    };
    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addLoadingWithSuccess = useCallback((
    loadingTitle: string,
    loadingMessage: string,
    successTitle: string,
    successMessage: string,
    loadingDuration: number = 3000
  ) => {
    const id = addToast('loading', loadingTitle, loadingMessage, true, 0); // 0 means no auto-close for loading

    setTimeout(() => {
      setToasts((prev) =>
        prev.map((toast) =>
          toast.id === id
            ? {
                ...toast,
                type: 'success',
                title: successTitle,
                message: successMessage,
                duration: 4000,
              }
            : toast
        )
      );
      // We set a timeout here because for the success we want it to auto-remove after 4s
      setTimeout(() => {
        removeToast(id);
      }, 4000);
    }, loadingDuration);
  }, [addToast, removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, position, addToast, removeToast, setPosition, addLoadingWithSuccess }}>
      {children}
    </ToastContext.Provider>
  );
};
