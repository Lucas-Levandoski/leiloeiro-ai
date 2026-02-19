---
alwaysApply: false
description: When generating any fullstack project from scratch
---
1. For fullstack projects, you should always use Next.js with server actions, and keep everything on the server side, mainly for security reasons.
2. Avoid as much as possible to have any environment variables on the client side, e.g. NEXT_PUBLIC_API_KEY, mainly for security reasons.