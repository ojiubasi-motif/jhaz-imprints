# styles Style Guide

Unique conventions for stylesheets in this project:

- **CSS Variables for Theming**: `app/globals.css` extensively defines theme variables (like `--background`, `--foreground`, `--primary`, `--border`) for both `:root` (light mode) and `.dark` (dark mode) scopes.
- **Tailwind v4 Setup**: Uses Tailwind CSS v4 syntax (`@theme`) to integrate the custom CSS variables into the Tailwind configuration.
- **No CSS Modules**: The project strictly avoids CSS modules, preferring global CSS variables paired with inline Tailwind utility classes within components.

Example:
```css
@theme {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  
  --font-sans: var(--font-inter);
  --font-serif: var(--font-playfair);
}
```
