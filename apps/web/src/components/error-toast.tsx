"use client";

import { toast } from "@/hooks/use-toast";
import { AlertTriangle, X, Wifi, Clock, Shield, CreditCard } from "lucide-react";

export type ErrorType = 
  | "network"
  | "authentication" 
  | "validation"
  | "server"
  | "timeout"
  | "payment"
  | "generation"
  | "generic";

interface ErrorToastOptions {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

const errorConfig: Record<ErrorType, { icon: React.ComponentType<any>; defaultTitle: string; defaultDescription: string }> = {
  network: {
    icon: Wifi,
    defaultTitle: "Connection Error",
    defaultDescription: "Please check your internet connection and try again.",
  },
  authentication: {
    icon: Shield,
    defaultTitle: "Authentication Required",
    defaultDescription: "Please sign in to continue.",
  },
  validation: {
    icon: AlertTriangle,
    defaultTitle: "Invalid Input",
    defaultDescription: "Please check your input and try again.",
  },
  server: {
    icon: AlertTriangle,
    defaultTitle: "Server Error",
    defaultDescription: "Something went wrong on our end. Please try again later.",
  },
  timeout: {
    icon: Clock,
    defaultTitle: "Request Timeout",
    defaultDescription: "The request took too long. Please try again.",
  },
  payment: {
    icon: CreditCard,
    defaultTitle: "Payment Error",
    defaultDescription: "There was an issue processing your payment.",
  },
  generation: {
    icon: AlertTriangle,
    defaultTitle: "Generation Failed",
    defaultDescription: "We couldn't generate your trip. Please try again.",
  },
  generic: {
    icon: AlertTriangle,
    defaultTitle: "Error",
    defaultDescription: "Something went wrong. Please try again.",
  },
};

export function showErrorToast(
  type: ErrorType,
  options: ErrorToastOptions = {}
) {
  const config = errorConfig[type];
  const Icon = config.icon;

  toast({
    variant: "destructive",
    title: (
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {options.title || config.defaultTitle}
      </div>
    ),
    description: options.description || config.defaultDescription,
    action: options.action ? (
      <button
        onClick={options.action.onClick}
        className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50"
      >
        {options.action.label}
      </button>
    ) : undefined,
    duration: options.duration,
  });
}

// Specific error toast functions
export const errorToasts = {
  network: (options?: ErrorToastOptions) => showErrorToast("network", options),
  
  authentication: (options?: ErrorToastOptions) => showErrorToast("authentication", {
    action: {
      label: "Sign In",
      onClick: () => window.location.href = "/sign-in",
    },
    ...options,
  }),
  
  validation: (field?: string, options?: ErrorToastOptions) => showErrorToast("validation", {
    description: field ? `Please check the ${field} field.` : undefined,
    ...options,
  }),
  
  server: (options?: ErrorToastOptions) => showErrorToast("server", options),
  
  timeout: (options?: ErrorToastOptions) => showErrorToast("timeout", {
    action: {
      label: "Retry",
      onClick: () => window.location.reload(),
    },
    ...options,
  }),
  
  payment: (options?: ErrorToastOptions) => showErrorToast("payment", {
    action: {
      label: "Contact Support",
      onClick: () => window.open("mailto:support@tripthesia.com"),
    },
    ...options,
  }),
  
  generation: (options?: ErrorToastOptions) => showErrorToast("generation", {
    action: {
      label: "Try Again",
      onClick: () => window.location.reload(),
    },
    ...options,
  }),
  
  generic: (message?: string, options?: ErrorToastOptions) => showErrorToast("generic", {
    description: message,
    ...options,
  }),
};

// Error handler that automatically determines error type and shows appropriate toast
export function handleApiError(error: any) {
  console.error("API Error:", error);

  // Network errors
  if (!navigator.onLine) {
    return errorToasts.network();
  }

  // HTTP status code based errors
  if (error.status) {
    switch (error.status) {
      case 401:
        return errorToasts.authentication();
      case 400:
        return errorToasts.validation();
      case 408:
        return errorToasts.timeout();
      case 402:
      case 403:
        return errorToasts.payment();
      case 500:
      case 502:
      case 503:
        return errorToasts.server();
      default:
        return errorToasts.generic(`Request failed with status ${error.status}`);
    }
  }

  // Timeout errors
  if (error.name === "AbortError" || error.message?.includes("timeout")) {
    return errorToasts.timeout();
  }

  // Network connection errors
  if (error.message?.includes("Failed to fetch") || error.message?.includes("Network")) {
    return errorToasts.network();
  }

  // Generic error with message
  return errorToasts.generic(error.message || "An unexpected error occurred");
}

// Success toast helper
export function showSuccessToast(title: string, description?: string) {
  toast({
    title,
    description,
    className: "border-green-200 bg-green-50 text-green-800",
  });
}

// Info toast helper
export function showInfoToast(title: string, description?: string) {
  toast({
    title,
    description,
    className: "border-blue-200 bg-blue-50 text-blue-800",
  });
}