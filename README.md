# Authentication Service

A standalone identity microservice built with Node.js and Express. It handles user registration and login via email/password, stateless access token issuance via RS256-signed JWTs, refresh token lifecycle management with rotation and reuse detection, federated login via Google OAuth 2.0 with PKCE, and a JWKS endpoint so downstream services can verify tokens locally — with no runtime calls back to this service.

---

## Features

- **RS256 asymmetric JWTs** — access tokens signed with a private key; downstream services verify using the published public key, no shared secret
- **JWKS endpoint** — `/.well-known/jwks.json` exposes the public key as a JSON Web Key Set for independent token verification by any service in the ecosystem
- **Refresh token rotation** — every `/refresh-token` call issues a new token pair and hard-deletes the old one; presenting an already-rotated token triggers full session revocation for that user
- **Redis-backed access token denylist** — logout adds the token's `jti` to Redis with a TTL matching its remaining lifetime, enabling instant revocation without breaking stateless verification
- **HttpOnly cookie transport** — refresh tokens travel in `httpOnly; secure; sameSite=strict` cookies scoped to the refresh path, inaccessible to JavaScript
- **Google OAuth 2.0 + PKCE + OIDC** — Authorization Code flow with a cryptographically generated code verifier/challenge, `state` for CSRF protection, `nonce` for replay protection, and ID token verification via `google-auth-library`; supports account linking between email/password and Google identities
- **Strict email validation** — rejects typo TLDs, suspicious domain patterns, and repeated subdomain segments before touching the database
- **Internal performer validation** — an unversioned internal route for downstream services to validate a list of user IDs against the user store
- **Structured logging** — Pino JSON logs at every lifecycle event; no `console.log` in production paths

---



## API Endpoints



### Authentication


| Method | Path                          | Description                                                         |
| ------ | ----------------------------- | ------------------------------------------------------------------- |
| `POST` | `/v1/auth/basic-registration` | Register a new user (email, password, role)                         |
| `POST` | `/v1/auth/basic-login`        | Log in; returns access token + sets refresh token cookie            |
| `POST` | `/v1/auth/refresh-token`      | Rotate refresh token; returns new access token + new refresh cookie |
| `POST` | `/v1/auth/logout`             | Revoke refresh token and denylist the access token                  |




### Google OAuth 2.0


| Method | Path                        | Description                                                                                    |
| ------ | --------------------------- | ---------------------------------------------------------------------------------------------- |
| `GET`  | `/v1/oauth/google`          | Initiate Google OAuth flow — generates PKCE params, stores state in Redis, redirects to Google |
| `GET`  | `/v1/oauth/google/callback` | Handle Google callback — exchanges code, verifies ID token, issues token pair                  |




### Internal


| Method | Path                                     | Description                                             |
| ------ | ---------------------------------------- | ------------------------------------------------------- |
| `POST` | `/v1/internal/users/validate-performers` | Validate a list of user IDs (for a downstream services) |




### Discovery & Infrastructure


| Method | Path                     | Description                                                    |
| ------ | ------------------------ | -------------------------------------------------------------- |
| `GET`  | `/.well-known/jwks.json` | RS256 public key as a JWKS document                            |
| `GET`  | `/health`                | Liveness and readiness check — reports `db` and `redis` status |


---



## Prerequisites

- Node.js 20+ (LTS)
- PostgreSQL 15+
- Redis 7+
- An RS256 key pair (private key for signing, public key for verification — see Local Setup)
- A Google Cloud Console OAuth 2.0 application (for Google login)

---



## Tech Stack


| Concern                | Choice                             |
| ---------------------- | ---------------------------------- |
| Runtime                | Node.js (LTS)                      |
| Framework              | Express.js ^5.2                    |
| ORM                    | Sequelize ^6.37 + sequelize-cli    |
| Database               | PostgreSQL                         |
| Cache / token denylist | Redis via ioredis ^5.11            |
| Authentication         | jsonwebtoken ^9 (RS256)            |
| Google OAuth + OIDC    | google-auth-library ^10            |
| HTTP client            | axios ^1.18                        |
| Password hashing       | bcryptjs ^3                        |
| Validation             | express-validator ^7.3             |
| ID generation          | uuid ^14                           |
| Cookies                | cookie-parser ^1.4                 |
| Logging                | pino ^10                           |
| Environment config     | dotenv ^17                         |
| Testing                | Jest + Supertest + @faker-js/faker |
| Dev server             | nodemon                            |


---



## Environment Variables

Create a `.env` file at the project root (copy from `.env.example`). All variables are required unless a default is noted.

```env
# Server
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
POSTGRES_DATABASE=authentication_db
POSTGRES_DATABASE_TEST=authentication_db_test

# Redis
REDIS_URL=redis://localhost:6379

# RS256 key paths
JWT_PRIVATE_KEY_PATH=./keys/private.pem
JWT_PUBLIC_KEY_PATH=./keys/public.pem

# JWT settings
JWT_ISSUER=https://dev.example.com
JWT_AUDIENCE=https://api.example.com
JWT_KEY_ID=replace-with-key-id
JWT_ACCESS_TOKEN_TTL=900      # seconds — 900 = 15 minutes
JWT_REFRESH_TOKEN_TTL=604800  # seconds — 604800 = 7 days

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/v1/oauth/google/callback
GOOGLE_TOKEN_URL=https://oauth2.googleapis.com/token
```

---



## Local Setup



### 1. Install dependencies

```bash
npm install
```



### 2. Generate an RS256 key pair

The service signs JWTs with RS256 — a private key signs, a public key verifies. Generate a pair and place it at the paths configured in `.env`:

```bash
mkdir -p keys
openssl genpkey -algorithm RSA -out keys/private.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -pubout -in keys/private.pem -out keys/public.pem
```



### 3. Configure environment variables

```bash
cp .env.example .env
# Edit .env with your database credentials, Redis URL, and Google OAuth details
```



### 4. Run database migrations

```bash
npx sequelize-cli db:migrate
```



### 5. Start the development server

```bash
npm run dev
```

The server listens on `http://localhost:$PORT` (default: `3000`). A `GET /health` readiness check is available without authentication and reports live `db` and `redis` connection status.

---



## Running Tests

Tests run against a dedicated `POSTGRES_DATABASE_TEST` database. Jest's `globalSetup` creates it and runs all pending migrations automatically before the suite starts; `globalTeardown` drops it when the suite finishes.

```bash
# Run the full test suite
npm test

# Run a single test file
npm test -- --testPathPattern=basic-login

# Run with verbose output
npm test -- --verbose

# Run a single named test
npm test -- --testNamePattern="should return 401"
```

Integration tests hit a real PostgreSQL database and a real Redis instance. No database mocks are used — this keeps test behaviour faithful to production query semantics and ensures the middleware chain, validators, and token lifecycle all execute end-to-end.

---



## Database Migrations

```bash
# Run pending migrations (development database)
npx sequelize-cli db:migrate

# Generate a new migration file
npx sequelize-cli migration:generate --name <description>

# Undo the last migration
npx sequelize-cli db:migrate:undo
```

Migrations live in `src/migrations/` and follow the pattern `<timestamp>-<description>.js`.

---



## How It Works

The authentication service has three technically interesting areas worth understanding in depth: how asymmetric JWTs enable zero-latency downstream verification, how refresh token rotation catches token theft, and how the Google OAuth 2.0 flow is hardened with PKCE and OIDC nonces.

### RS256 and the JWKS endpoint

Most token-based systems use a symmetric algorithm like HS256, where both the issuer and every verifier share the same secret. That creates a coupling problem in microservices: every downstream service needs the secret, and a compromise of any one of them compromises all tokens globally.

This service uses RS256 — an asymmetric algorithm. A **private key** signs tokens here and only here. Downstream services hold only the **public key**, which can verify signatures but cannot forge them. A compromise of a downstream service leaks nothing that allows new tokens to be minted.

The public key is published at `/.well-known/jwks.json` as a JSON Web Key Set. Downstream services fetch it once and cache it. The JWKS response looks like this:

```json
{
  "keys": [{
    "kty": "RSA",
    "use": "sig",
    "alg": "RS256",
    "kid": "auth-key-001",
    "n": "...",
    "e": "AQAB"
  }]
}
```

The `kid` (key ID) field is the link between a token's header and the correct key in the set. If the service ever rotates keys, both old and new can coexist in the JWKS during a transition window. Downstream services check the token's `kid` header claim, find the matching key in the JWKS, and verify the signature using the `n` (modulus) and `e` (exponent) parameters. This verification adds **zero network latency** to downstream requests — no call back to this service is needed.

Access tokens carry `sub` (user ID), `email`, `role`, `jti` (a unique token identifier), `iss`, `aud`, and `exp`. Refresh tokens carry only `sub` and `jti` — they are not intended for downstream consumption, only for rotating sessions here.

---



### Refresh token rotation and reuse detection

Refresh tokens are the long-lived credential that allows users to stay logged in past the access token's 15-minute window. Because they live longer, they are also the higher-value target for theft. The service protects against this with two mechanisms: **rotation** and **reuse detection**.

**Rotation** means every successful `/v1/auth/refresh-token` call performs an atomic swap:

1. The incoming refresh token's `jti` is verified against the `refresh_tokens` table — it must exist and not have been deleted.
2. The old record is hard-deleted from the database.
3. A new access token and a new refresh token are issued.
4. The new refresh token's `jti` is written to the `refresh_tokens` table.
5. The new refresh token is set in the `httpOnly` cookie.

After the swap, the old refresh token is permanently invalid. Any subsequent attempt to use it fails at step 1.

**Reuse detection** is what happens when that attempt occurs. If a refresh token whose `jti` is not in the database is presented to `/v1/auth/refresh-token`, the middleware does not just reject the request. It calls `revokeAllUserSessions(userId)`, which deletes **every** `refresh_tokens` row for that user in a single statement. This forces a full logout across all devices.

The logic behind this response is that a legitimately-rotating client would never present an old token. If an old token arrives, one of two things happened: the attacker got the token before the client rotated it, or the attacker rotated it before the legitimate client could. Either way, there is a real or potential session theft in progress. Revoking all sessions is the conservative, correct response — it forces the real user to log in again and immediately kills any attacker-held session.

The refresh token cookie is scoped to `path: '/v1/auth/refresh-token'` — the browser sends it only on that path, never on application API calls. This limits the window in which the cookie could be replayed.

---



### Redis-backed access token denylist

Access tokens are stateless by design. The server holds no record of them. That makes logout tricky: even after a user calls `/v1/auth/logout`, a stolen access token remains valid until it expires naturally.

The denylist solves this without making access tokens stateful. On logout, the service:

1. Verifies the access token from the `Authorization` header.
2. Computes `remainingTtl = payload.exp − Math.floor(Date.now() / 1000)`.
3. Writes `denylist:<jti>` → `"1"` to Redis with that TTL.

Downstream services check the denylist by looking up `denylist:<jti>` in Redis before accepting the token. If the key exists, the token is rejected as if it had expired.

Two properties make this efficient: the Redis key exists only as long as the token would have been valid anyway (the TTL matches remaining lifetime), so the denylist is self-cleaning and never grows unboundedly. And the `jti` is a UUID-derived string — the lookup is an O(1) key existence check, not a scan.

Logout also clears the refresh token cookie and hard-deletes the refresh token's `jti` from the `refresh_tokens` table. All three actions happen in the same request, so after a successful logout call no credential the user held can be used again.

---



### Google OAuth 2.0 + PKCE + OIDC

The Google OAuth flow uses the Authorization Code grant — the most secure variant for server-side applications. It is hardened with three additional mechanisms: **PKCE** (Proof Key for Code Exchange), a **state** parameter, and an **OIDC nonce**.

**Why PKCE?** The Authorization Code grant exchanges a short-lived `code` for tokens. If an attacker can intercept the `code` (possible in certain redirect environments), they can exchange it themselves. PKCE prevents this by having the client generate a random `codeVerifier`, hash it into a `codeChallenge`, and send the challenge with the authorization request. Google binds the issued code to that challenge. When the code is exchanged for tokens, the original `codeVerifier` must be presented — the attacker who intercepted the code cannot provide it.

The `codeVerifier` is 32 random bytes encoded as base64url; the `codeChallenge` is its SHA-256 hash, also base64url-encoded:

```js
const codeVerifier = crypto.randomBytes(32).toString('base64url');
const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
```

**Why** `state`**?** The `state` parameter is a CSRF defense. When the flow is initiated, a random 16-byte hex string is generated and stored in Redis alongside the `codeVerifier` and `nonce` (10-minute TTL). Google reflects this value back in the callback URL. The callback middleware reads the stored state, verifies it matches, then deletes it — a one-time use check that prevents an attacker from crafting a callback URL that processes their authorization code in the victim's session.

**Why a** `nonce`**?** The `nonce` is an OIDC replay defense. It is embedded in the authorization request and Google includes it inside the ID token it issues. The callback verifier checks that the `nonce` in the ID token matches the one that was stored in Redis for this session. Without this check, an attacker who obtained a valid ID token from a different flow could replay it in a new callback request.

**Account linking.** When Google returns a verified `sub` (Google's stable user identifier) and `email`, the service calls `userRepository.findOrCreateGoogleUser({ googleSub, email })`. This either creates a new user record or links the Google identity to an existing email/password account — so a user who registered via email can later log in with Google without creating a duplicate account.

After account resolution, the flow is identical to basic login: revoke any existing sessions, issue a new access/refresh token pair, set the cookie, and return the access token.

---



### The validation middleware chain

The login flow is a good example of how the middleware chain is used to do work incrementally and pass hydrated state to the controller:

```
POST /v1/auth/basic-login
  → emailFieldValidator       (express-validator: format + suspicious TLD check)
  → loginPasswordFieldValidator (express-validator: not empty)
  → handleBadRequests(...)    (collect any validation errors, throw BadRequest)
  → emailExistsValidator      (async: query DB → attach user to req.user)
  → verifyPasswordValidator   (bcrypt compare → throw BadRequest if wrong)
  → basicLoginController      (reads req.user, signs tokens, sets cookie, sends response)
```

The `handleBadRequests` step is the boundary between field-level validation (things that can be checked without a database round-trip) and identity-level validation (things that require a query). All field errors are collected and returned in a single response before any database query runs — this prevents leaking whether an email exists just from the error structure, and avoids unnecessary database hits for obviously malformed requests.

`emailExistsValidator` and `verifyPasswordValidator` run as plain Express middleware rather than `express-validator` chains because they need to call `next(error)` directly. The user record loaded by `emailExistsValidator` is attached to `req.user` and passed forward — the controller reads it without querying the database again.

Password verification uses `bcrypt.compare` via `user.isValidPassword(password)`, a method attached directly to the `User` model instance. The controller never handles raw passwords; the middleware handles all credential verification before the controller is reached.

---



## Scripts Reference


| Script              | Command                | Description                                     |
| ------------------- | ---------------------- | ----------------------------------------------- |
| Start (production)  | `npm start`            | Run with `node`                                 |
| Start (development) | `npm run dev`          | Run with `nodemon` (hot reload)                 |
| Test                | `npm test`             | Run Jest suite (creates and tears down test DB) |
| Lint                | `npm run lint`         | ESLint check                                    |
| Lint (fix)          | `npm run lint:fix`     | ESLint auto-fix                                 |
| Format check        | `npm run format:check` | Prettier check                                  |
| Format (fix)        | `npm run format:fix`   | Prettier auto-fix                               |


