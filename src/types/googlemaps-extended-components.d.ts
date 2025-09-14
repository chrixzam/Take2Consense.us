declare namespace JSX {
  interface IntrinsicElements {
    'gmpx-api-loader': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      // Note: 'key' is a reserved prop in React; we set it imperatively in index.html
      'solution-channel'?: string;
    };
    'gmpx-place-picker': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      placeholder?: string;
      // Allow arbitrary attributes to avoid TS friction with web component APIs
      [attr: string]: any;
    };
  }
}

