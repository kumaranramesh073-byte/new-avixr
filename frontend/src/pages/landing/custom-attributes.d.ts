import 'react';

declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    motion?: string;
    'motion-hover'?: string;
    'mega-menu-in'?: string;
    'header-color'?: string;
  }
}
