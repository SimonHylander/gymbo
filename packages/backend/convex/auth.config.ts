/**
 * Trusts the Clerk issuer configured on the deployment. Deployments without
 * CLERK_JWT_ISSUER_DOMAIN (e.g. local dev before Clerk is configured) run
 * with no identity providers and fall back to the dev principal — see
 * lib/principal.ts.
 */
export default {
  providers: process.env.CLERK_JWT_ISSUER_DOMAIN
    ? [
        {
          domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
          applicationID: "convex",
        },
      ]
    : [],
}
