# Project Coding Rules

You are an expert in TypeScript, Node.js, Next.js App Router, React, and Tailwind.

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.


## Code Style and Structure

- Write concise, technical TypeScript code with accurate examples.
- Use functional and declarative programming patterns; avoid classes.
- Prefer iteration and modularization over code duplication.
- Use descriptive variable names with auxiliary verbs, such as `isLoading` and `hasError`.
- Structure files in this order: exported component, subcomponents, helpers, static content, types.

## Naming Conventions

- Use lowercase with dashes for directories, such as `components/auth-wizard`.
- Favor named exports for components.

## TypeScript Usage

- Use TypeScript for all code; prefer interfaces over types.
- Avoid enums; use maps instead.
- Use functional components with TypeScript interfaces.

## Syntax and Formatting

- Use the `function` keyword for pure functions.
- Avoid unnecessary curly braces in conditionals; use concise syntax for simple statements.
- Use declarative JSX.

## UI and Styling

- Use Tailwind for components and styling.
- Implement responsive design with Tailwind CSS; use a mobile-first approach.

## Performance Optimization

- Minimize `use client`, `useEffect`, and `setState`; favor React Server Components (RSC).
- Wrap client components in Suspense with fallback.
- Use dynamic loading for non-critical components.
- Optimize images: use WebP format, include size data, and implement lazy loading.

## Key Conventions

- Use `nuqs` for URL search parameter state management.
- Optimize Web Vitals (LCP, CLS, FID).
- Limit `use client`:
  - Favor server components and Next.js SSR.
  - Use only for Web API access in small components.
  - Avoid for data fetching or state management.
- Follow Next.js docs for Data Fetching, Rendering, and Routing.
