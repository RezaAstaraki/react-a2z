---
name: react-a2z
description: React component library with Tailwind CSS and Rollup bundling.
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [react, components, tailwind, library]
    related_skills: [dogfood]
---

# react-a2z

React component library providing reusable UI components, hooks, and utilities for building modern React applications with Tailwind CSS styling and TypeScript support.

## Overview

This library provides pre-built React components with Tailwind CSS classes, TypeScript types, and Rollup bundling. All interactive components include `"use client"` directive for Next.js App Router compatibility.

## When to Use

- You need Button, Input, Modal, Toast, or Markdown editor components
- You need utility hooks like `useDebounce`, `useInView`, or `useWindowSize`
- You need utility functions like `cn` for class merging or digit conversion
- You're building a React/Next.js application with Tailwind CSS

Don't use for:
- Creating your own component variants without customization
- Pure server-side rendering without client components
- Projects not using Tailwind CSS

## Components

### Button
Clickable button with variants (`filled-blue`, etc.) for primary actions.

### Input
Form input with label and placeholder support for text entry.

### MdEditor
Markdown editor (1032 lines) with rich text editing capabilities.

### Md
Markdown renderer with syntax highlighting for displaying markdown content.

### Modal
Modal dialogs using `CustomModal` and `GlobalModal` with state management.

### PearlButton
Specialized button component with custom styling.

### Toast
Notification toast system with `GlobalToast` and `ToastItem` components.

### ClientLogger
Client-side logging utility with `Wrapper` component for debugging.

### Counter
Counter utility component for increment/decrement operations.

## Hooks

- `useDebounce`: Debounce utility for delayed execution
- `useDebouncedCallback`: Debounced callback wrapper for event handlers
- `useElementSize`: Element size observer hook
- `useInView`: Intersection Observer hook for scroll detection
- `useThrottle`: Throttle utility for rate-limited operations
- `useWindowSize`: Window size observer hook

## Utilities

Located in `src/utils`:

- `cn`: Class name merger for conditional styling
- `englishDigitsToPersian`: Convert English digits to Persian
- `persianToEnglishDigits`: Convert Persian digits to English
- `formDataMaker`: Form data helper for structured data
- `sanitizeNumericInput`: Input sanitization for numeric values
- `truncateText`: Text truncation with ellipsis
- `readFileAsDataUrl`: File reader helper for data URLs

## Styling

- Tailwind CSS with custom `pearl-button.css` theme
- `tailwind.config.js` and `tailwind.preset.js` for configuration
- `tailwind.css` auto-scans `dist` for library class names

## Build

- Rollup bundling with `rollup.config.js`
- TypeScript with `tsconfig.json`
- All interactive components include `"use client"` directive

## Installation

```bash
npm install react-a2z
```

## Tailwind v4 Setup (Recommended)

In your app's `globals.css`:

```css
@import "tailwindcss";
@source "./src/**/*.{js,ts,jsx,tsx}";
@import "react-a2z/tailwind.css";
```

Use PostCSS configuration:

```js
// postcss.config.mjs
export default {
  plugins: { "@tailwindcss/postcss": {} },
};
```

## Tailwind v3 Setup (Legacy)

```js
import reactA2zPreset, { contentPaths } from "react-a2z/tailwind";

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

## Usage Example

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

## File Structure

```
react-a2z/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   ├── ClientLogger/
│   │   ├── Counter/
│   │   ├── Input/
│   │   ├── MdEditor/
│   │   ├── Md/
│   │   ├── Modal/
│   │   ├── PearlButton/
│   │   └── Toast/
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   ├── useDebouncedCallback.ts
│   │   ├── useElementSize.ts
│   │   ├── useInView.ts
│   │   ├── useThrottle.ts
│   │   └── useWindowSize.ts
│   └── utils/
│       ├── cn.tsx
│       ├── englishDigitsToPersian.ts
│       ├── persianToEnglishDigits.ts
│       ├── formDataMaker.ts
│       ├── sanitizeNumericInput.ts
│       ├── truncateText.ts
│       └── readFileAsDataUrl.ts
├── styles/
│   └── pearl-button.css
├── tailwind.config.js
├── tailwind.preset.js
├── tailwind.css
├── rollup.config.js
├── tsconfig.json
└── package.json
```

## Verification

To verify the library works in your project:

1. Install the package: `npm install react-a2z`
2. Configure Tailwind CSS as shown above
3. Import and use components: `import { Button } from "react-a2z"`
4. Build your project: `npm run build`
