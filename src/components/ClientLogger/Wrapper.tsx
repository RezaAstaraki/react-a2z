'use client';

import React from 'react';
import ClientLogger from './ClientLogger';

type ClientLoggerProps = {
  /** The value to inspect. Any JSON-serialisable shape: object, array, or primitive. */
  data: any;
  /** Optional label appended to the header, e.g. `"user response"`. */
  label?: string;
  /** Start with the data panel expanded. Default `false`. */
  showDataInUi?: boolean;
  /** Start with the console checkbox checked. The checkbox prints `data` on toggle; it does not emit on mount. Default `false`. */
  showDataConsole?: boolean;
  /** JSON indent width in spaces. Default `4`. */
  indent?: number;
};

export default function Wrapper({ ...props }: ClientLoggerProps) {
  return <ClientLogger {...props} />;
}
