# Style Guide: Email Templates

## Unique Conventions
- Templates are pure functions returning `{ subject: string, html: string }` (EmailTemplate interface)
- All HTML uses inline CSS for email client compatibility — no external stylesheets
- Helper functions `formatPrice()` and `formatDate()` have safe defaults (never throw on null/undefined)
- Table-based layout for cross-client rendering
- Gradient header bar: `background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- Nigerian Naira symbol (₦) used in price displays
- Template naming: `{event}Email()` (e.g., `orderConfirmedEmail`, `statusUpdateEmail`, `adminOrderAlertEmail`)
- Admin alerts use amber gradient: `linear-gradient(135deg, #f59e0b 0%, #d97706 100%)`
- Conditional HTML sections rendered via ternary expressions returning HTML strings or empty strings
