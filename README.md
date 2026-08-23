# react-a2z

React component library with Tailwind CSS styling, TypeScript support, and Next.js App Router compatibility.

## Install

```bash
npm install react-a2z
```

Peer dependencies: `react` (>=18) and `tailwindcss` (>=3.4 or v4).

## Tailwind v4 setup (recommended)

Components use Tailwind utility classes. In your app `globals.css`:

```css
@import "tailwindcss";
@source "./src/**/*.{js,ts,jsx,tsx}";
@import "react-a2z/tailwind.css";
```

`react-a2z/tailwind.css` scans `./dist` for library class names. Paths resolve from `node_modules/react-a2z/`, so this works with npm install and `npm link`.

PostCSS (Next.js example):

```js
// postcss.config.mjs
export default {
  plugins: { "@tailwindcss/postcss": {} },
};
```

## Tailwind v3 setup (legacy)

```js
import reactA2zPreset, { contentPaths } from "react-a2z/tailwind";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [reactA2zPreset],
  content: ["./src/**/*.{js,ts,jsx,tsx}", ...contentPaths],
};
```

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Usage

```tsx
"use client";

import { Button, Input } from "react-a2z";

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
