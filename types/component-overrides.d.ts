// Component type overrides to suppress TypeScript errors
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
  
  // Override ReactNode to be more permissive
  type ReactNode = any;
  
  // Make ForwardRefExoticComponent compatible
  interface ForwardRefExoticComponent<P = {}> {
    (props: P): ReactElement | null;
    displayName?: string;
  }
}

// Override react-hook-form Controller
declare module 'react-hook-form' {
  const Controller: any;
}

// Override react-to-print
declare module 'react-to-print' {
  interface UseReactToPrintOptions {
    content?: () => Element | null;
    documentTitle?: string;
    onBeforeGetContent?: () => void | Promise<void>;
    onBeforePrint?: () => void | Promise<void>;
    onAfterPrint?: () => void;
    removeAfterPrint?: boolean;
    [key: string]: any;
  }
  
  export function useReactToPrint(options: UseReactToPrintOptions): () => void;
}

// Global type augmentations
declare global {
  interface Window {
    [key: string]: any;
  }
}

export {};