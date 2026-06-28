# Tailwind CSS + Radix UI for the design system

The PWA uses Tailwind CSS for styling and Radix UI for accessible component primitives. Radix provides unstyled, WAI-ARIA-compliant primitives (dialog, dropdown, form controls) with built-in keyboard navigation and screen-reader support. Tailwind handles the visual layer. This combination hits WCAG 2.1 AA from the start with a small CSS payload suitable for low-connectivity environments. MUI was rejected for its bundle size and Material Design aesthetic, which doesn't fit the domain.
