'use client';

import React, { useEffect } from 'react';
import Tooltip from '../tooltip';
import { ToastType } from './toast-context';
import { 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  AlertTriangle, 
  Loader2, 
  X 
} from 'lucide-react';

interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  showIcon?: boolean;
  duration?: number;
  onClose: (id: string) => void;
}

export default function Toast({
  id,
  type,
  title,
  message,
  showIcon = true,
  duration = 5000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, id, onClose]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    loading: <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />,
  };

  const colors = {
    success: 'bg-white  border-green-500/20 shadow-green-500/10',
    error: 'bg-white  border-red-500/20 shadow-red-500/10',
    info: 'bg-white  border-blue-500/20 shadow-blue-500/10',
    warning: 'bg-white  border-yellow-500/20 shadow-yellow-500/10',
    loading: 'bg-white  border-gray-500/20 shadow-gray-500/10',
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl border shadow-lg 
        transform transition-all duration-300 animate-in fade-in slide-in-from-right-8
        ${colors[type]}
      `}
      role="alert"
    >
      {showIcon && <div className="mt-0.5">{icons[type]}</div>}
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-900  leading-tight">
          {title}
        </h4>
        {message && (
          <p className="mt-1 text-xs text-gray-600  leading-normal">
            {message}
          </p>
        )}
      </div>

      <Tooltip content="Close">
        <button
          onClick={() => onClose(id)}
          className="text-gray-400 hover:text-gray-600  transition-colors p-1"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </Tooltip>
    </div>
  );
}
