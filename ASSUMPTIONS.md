# Assumptions

## Auth
- Any user can register via `POST /auth/register`.  
  In production, registrations can be locked behind an invite system or admin-only endpoint.
- The first registered user gets `VIEWER` role by default. Admins must manually elevate roles.
- JWT tokens expire in 7 days (configurable via `JWT_EXPIRES_IN`).

## RBAC
- Roles are hierarchical: `ADMIN > ANALYST > VIEWER`.  
  A route requiring `ANALYST` permits both `ANALYST` and `ADMIN`.
- Inactive (`INACTIVE`) users cannot log in but their data is retained.
- Record ownership check for `PATCH /records/:id`:  
  Analysts can only update their own records; Admins can update any.

## Financial Records
- `amount` must be positive. The `type` field (`INCOME`/`EXPENSE`) determines sign semantics.
- Records are soft-deleted (field `deletedAt`). All query filters exclude soft-deleted records.
- `date` is user-supplied (allows backdating). No server-side restriction on past/future dates.

## Database
- `SQLite` used in development for zero setup. Swap `DATABASE_URL` in `.env` for Postgres in production (no schema change needed).
- `uuid()` is used for all primary keys to avoid sequential ID enumeration.

## Pagination
- Default page=1, limit=20. Maximum limit is capped via DTO validation to prevent resource exhaustion attacks.

## Rate Limiting
- 100 requests per minute per IP. Adjustable via `THROTTLE_LIMIT` and `THROTTLE_TTL` env vars.

## Tradeoffs Considered
1. **SQLite vs PostgreSQL:** SQLite was chosen to guarantee a zero-friction local setup for the reviewer. The codebase uses Prisma, so swapping to a production Postgres instance only requires changing `DATABASE_URL` in `.env`.
2. **JWT vs Stateful Sessions:** Opted for Passport-JWT for stateless, highly scalable authentication. The tradeoff is that immediate token revocation requires a blacklist strategy, which is bypassed here by keeping token lifespans short (7d) and disabling users via the `UsersModule` (which is checked during JWT validation).
3. **Soft Deletes vs Hard Deletes:** Soft deletes were implemented to preserve financial history and ensure analytical integrity. The tradeoff is database size bloat over time.
4. **Dates from Client vs Server:** The `date` field on records is user-supplied to allow backdating of offline expenses. A tradeoff was made to accept past dates while strictly rejecting future dates via a custom `@IsNotFuture` validator.

## Not Implemented (Out of Scope)
- Email verification and password resets
- Multi-tenancy (Single company/household assumed)
- External OAuth Providers (Google/GitHub login)
