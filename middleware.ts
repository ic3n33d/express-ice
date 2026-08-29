import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// This locks down the driver page. Anyone who tries to visit it will be redirected to login!
const isDriverRoute = createRouteMatcher(['/driver(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isDriverRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}