# react-a2z

React component library with Tailwind CSS styling, TypeScript support, and Next.js App Router compatibility.

## Install

```bash
npm install react-a2z
```

Peer dependencies: `react` (>=18) and `tailwindcss` (>=3.4).

## Tailwind setup

Components use Tailwind utility classes. Add the library preset and content paths to your app's `tailwind.config.js`:

```js
import reactA2zPreset, { contentPaths } from 'react-a2z/tailwind';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [reactA2zPreset],
  content: ['./src/**/*.{js,ts,jsx,tsx}', ...contentPaths],
};
```

For Next.js, make sure your global CSS imports Tailwind as usual (`@tailwind base;` etc.).

## Usage

```tsx
import { Button, Input } from 'react-a2z';

export default function Page() {
  return (
    <>
      <Button variant="filled-blue" text="Click me" />
      <Input label="Email" placeholder="you@example.com" />
    </>
  );
}
```

All interactive components include `"use client"`, so they work in the Next.js App Router without extra wrappers.
