# public-assets Style Guide

Unique conventions for public assets in this project:

- **Directory Structure**: Images are heavily organized. Product catalog images reside in `public/images/products/`, whereas marketing or hero imagery resides in `public/images/`.
- **File Naming**: Images follow a lowercase, kebab-case naming scheme representing exactly what they are (e.g., `agbada-brown-gold.jpg`, `kids-ankara-set.jpg`).
- **Static Access**: Assets are referenced statically from the root path (`/images/products/...`) within `next/image` component sources.

Example:
```tsx
<Image
  src="/images/products/agbada-royal-blue.jpg"
  alt="Royal Blue Agbada"
  fill
  className="object-cover transition-transform duration-500 group-hover:scale-105"
/>
```
