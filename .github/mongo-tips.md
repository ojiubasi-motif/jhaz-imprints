Good thinking. For now, **stay on M0** and focus on shipping. 

**One thing to do now regardless of tier** — add this to your `catalog-db` connection config before prod:

```typescript
const PROD_OPTIONS = {
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,        // Close idle connections after 30s
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  w: 'majority',               // Write concern for data durability
};
```

The `w: 'majority'` write concern is especially important for order and payment data.