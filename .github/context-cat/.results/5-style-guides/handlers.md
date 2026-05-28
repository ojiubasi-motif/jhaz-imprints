# Handlers Styleguide

## Unique Patterns
- **Custom Response Envelopes**: All JSON responses use a specific envelope structure unique to this API: `{ msg: string, data: any, type: "SUCCESS" | string, code: number }`.
- **Query Parameter Casting**: Because Express `req.query` parses values as strings, handlers are responsible for manually casting strings to numbers (e.g. `page: parseInt(page, 10)`) before handing them off to the services layer.
