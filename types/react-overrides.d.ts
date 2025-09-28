// React JSX overrides to fix component compatibility issues
import * as React from 'react'

declare global {
  namespace JSX {
    interface Element extends React.ReactElement<any, any> { }
    interface ElementClass extends React.Component<any> {
      render(): React.ReactNode
    }
    interface ElementAttributesProperty { props: {} }
    interface ElementChildrenAttribute { children: {} }

    interface IntrinsicAttributes extends React.Attributes { }
    interface IntrinsicClassAttributes<T> extends React.ClassAttributes<T> { }

    interface IntrinsicElements {
      [elemName: string]: any
    }
  }

  namespace React {
    type ComponentType<P = {}> = React.ComponentClass<P> | React.FunctionComponent<P>
    
    interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
      type: T;
      props: P;
      key: Key | null;
    }
    
    interface ReactNode {
      // Explicitly exclude bigint from ReactNode to fix the compatibility issue
      bigint?: never;
    }

    // Fix for Lucide React components
    interface ForwardRefExoticComponent<P> extends ComponentType<P> {
      $$typeof: symbol;
      render: (props: P, ref: any) => ReactElement | null;
      displayName?: string;
      propTypes?: any;
      contextTypes?: any;
      defaultProps?: any;
    }
  }
}

// Type augmentation for better compatibility
declare module 'react' {
  interface Component<P = {}, S = {}> {
    forceUpdate(callback?: () => void): void;
  }
  
  // Override ReactNode to exclude bigint
  type ReactNode = ReactChild | ReactFragment | ReactPortal | boolean | null | undefined;
  
  // Fix for Lucide icons and other ForwardRef components
  namespace JSX {
    interface ElementType extends React.JSXElementConstructor<any> {
      (props: any): ReactElement | null
    }
  }
}

// Augment Next.js Link component
declare module 'next/link' {
  interface LinkProps {
    href: string | object;
    as?: string | object;
    replace?: boolean;
    scroll?: boolean;
    shallow?: boolean;
    passHref?: boolean;
    prefetch?: boolean;
    locale?: string | false;
    legacyBehavior?: boolean;
    children?: React.ReactNode;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
    onMouseEnter?: React.MouseEventHandler<HTMLAnchorElement>;
    className?: string;
    style?: React.CSSProperties;
    [key: string]: any;
  }
  
  const Link: React.ForwardRefExoticComponent<LinkProps & React.RefAttributes<HTMLAnchorElement>>
  export = Link
}

export {}