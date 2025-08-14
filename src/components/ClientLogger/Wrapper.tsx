import React from 'react';
import ClientLogger from './ClientLogger';

type ClientLoggerProps = {
  data: any;
  label?: string;
  showDataInUi?: boolean;
  showDataConsole?: boolean;
  indent?: number;
};

export default function Wrapper({ ...props }: ClientLoggerProps) {
  return <ClientLogger {...props} />;
}
