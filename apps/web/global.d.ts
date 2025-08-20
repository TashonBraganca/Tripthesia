// Global type declarations

declare global {
  interface Window {
    Razorpay: any;
    analytics?: {
      track: (event: string, properties?: any) => void;
    };
  }
}

export {};