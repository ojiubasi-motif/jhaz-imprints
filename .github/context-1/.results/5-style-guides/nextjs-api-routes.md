# Style Guide: Next.js API Routes

## Unique Conventions
- API routes act as BFF proxies — they forward requests to the Express API and return the response
- Use `NextRequest`/`NextResponse` from `next/server`
- API base URL read from `process.env.NEXT_PUBLIC_API_URL` with fallback to `http://localhost:3000/api`
- Authorization header is forwarded from the incoming request to the Express API
- Error responses are proxied as-is with their original status codes
- Route files export named HTTP method handlers: `export async function POST(request: NextRequest)`
- Try-catch wraps the entire handler with 500 fallback
