'use client';

import React from 'react';
import { useToast, ToastPosition } from './toast-context';
import Toast from './toast';

export default function ToastMessages() {
  const { toasts, position, removeToast } = useToast();

  const getPositionClasses = (currentPosition: ToastPosition) => {
    switch (currentPosition) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'top-center':
        return 'top-4 left-1/2 -translate-x-1/2';
      case 'bottom-center':
        return 'bottom-4 left-1/2 -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  return (
    <div 
      className={`fixed p-4 space-y-2 w-full max-w-sm z-[9999] pointer-events-none ${getPositionClasses(position)}`}
    >
      <div className="flex flex-col gap-2 pointer-events-auto">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            showIcon={toast.showIcon}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}
