<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Project Context

This is the LSA Audit Tool for Local Search Ally — an AI-powered
local SEO auditor for NWA contractors.

Key rules:

- All API routes live in app/api/
- Brand tokens are defined as CSS custom properties in app/globals.css — consume via `var(--carolina)`, `var(--font-ui)`, etc. Never hardcode hex values or font names.
- The Anthropic API key is accessed via process.env.ANTHROPIC_API_KEY
- Never use the Pages Router — App Router only

## Styling rules

- Tailwind for layout and spacing utilities
- CSS Modules (styles/\*.module.css) for all component-specific visual styles
- CSS custom properties in globals.css are the single source of truth for brand tokens
- Inline styles ONLY for SVG geometry that requires runtime-calculated numbers
- Never hardcode hex values or font names directly in JSX
<!-- END:nextjs-agent-rules -->
