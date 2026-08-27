# authentication-service

A production-grade authentication and identity service built on Node.js (Express), implementing RS256 asymmetric JWT authentication, refresh token rotation, Google OAuth 2.0 with PKCE, and a JWKS endpoint for downstream service verification. Designed as a standalone microservice — other services verify tokens independently using the published public key, with no runtime calls back to this service.

## Description

`authentication-service` provides a complete identity layer for a microservices ecosystem. It handles user registration and login (email/password), stateless access token issuance via RS256-signed JWTs, refresh token lifecycle management (rotation, reuse detection, denylist), and federated login via Google OAuth 2.0 with OpenID Connect. The JWKS endpoint (`/.well-known/jwks.json`) exposes the public key so downstream services can verify tokens locally without shared secrets.

## Features

- **User Registration:** Register users with bcrypt-hashed passwords and role assignment.
- **Email/Password Login:** Authenticate users and issue RS256-signed access + refresh token pairs.
- **RS256 Asymmetric JWT:** Private key signs tokens on this service; downstream services verify using the published public key — no shared secret.
- **JWKS Endpoint:** Publishes the public key as a JSON Web Key Set for independent token verification by other services.
- **Refresh Token Rotation:** Every refresh issues a new token pair and hard-deletes the old one. Token reuse (presenting an already-rotated token) triggers full session revocation.
- **Access Token Denylist:** Redis-backed `jti` denylist with TTL matching the token's remaining lifetime — enables early revocation on logout without breaking stateless verification.
- **Google OAuth 2.0 + PKCE + OIDC:** Authorization Code flow with PKCE (code verifier/challenge), `state` (CSRF protection), `nonce` (replay protection), and ID token verification via `google-auth-library`. Supports account linking between email/password and Google identities.
- **HttpOnly Cookies:** Refresh tokens are stored in `httpOnly; secure; sameSite=strict` cookies — inaccessible to JavaScript.
- **Centralized Error Handling:** All error-to-response mapping flows through a single `exceptionHandler` middleware with typed custom exceptions.
- **Internal Validation Endpoint:** An internal-only route for downstream services to validate performer user IDs.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v1/auth/basic-registration` | Register a new user |
| `POST` | `/v1/auth/basic-login` | Login with email and password |
| `POST` | `/v1/auth/refresh-token` | Rotate the refresh token and issue a new access token |
| `POST` | `/v1/auth/logout` | Revoke refresh token and denylist the access token |
| `GET` | `/.well-known/jwks.json` | Publish the RS256 public key as a JWKS document |
| `GET` | `/v1/oauth/google` | Initiate Google OAuth 2.0 login (generates PKCE params + redirects) |
| `GET` | `/v1/oauth/google/callback` | Handle Google OAuth callback (exchange code, verify ID token, issue tokens) |
| `POST` | `/v1/internal/users/validate-performers` | Internal: validate a list of performer user IDs |
| `GET` | `/health` | Liveness check |

## Prerequisites

- Node.js (LTS)
- PostgreSQL 15+
- Redis 7+
- An RS256 key pair (private + public PEM files)
- A Google Cloud Console OAuth 2.0 application (for Google login)

## Technologies Used

| Concern | Technology |
|---------|-----------|
| Framework | Express.js 5 |
| Database / ORM | PostgreSQL via Sequelize + sequelize-cli |
| Cache / ephemeral store | Redis via ioredis |
| Auth tokens | jsonwebtoken (RS256), key pair loaded from disk |
| Password hashing | bcryptjs |
| Google OAuth + OIDC | google-auth-library |
| HTTP client | axios |
| Validation | express-validator |
| ID generation | uuid |
| Cookies | cookie-parser |
| Environment config | dotenv |
| Testing | Jest + Supertest + @faker-js/faker |
| Dev server | nodemon |

## Environment Variables

Create a `.env` file in the root directory:

```sh
# PostgreSQL
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
POSTGRES_DATABASE=authentication_db
POSTGRES_DATABASE_TEST=authentication_db_test
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379

# RS256 Key Pair
JWT_PRIVATE_KEY_PATH=/path/to/private.pem
JWT_PUBLIC_KEY_PATH=/path/to/public.pem

# JWT Settings
JWT_ISSUER=authentication-service
JWT_AUDIENCE=authentication-service
JWT_KEY_ID=auth-key-001
JWT_ACCESS_TOKEN_TTL=900          # seconds (e.g. 900 = 15 minutes)
JWT_REFRESH_TOKEN_TTL=604800      # seconds (e.g. 604800 = 7 days)

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/v1/oauth/google/callback
GOOGLE_TOKEN_URL=https://oauth2.googleapis.com/token
```

### Generating an RS256 Key Pair

```bash
# Generate private key
openssl genrsa -out private.pem 2048

# Extract public key
openssl rsa -in private.pem -pubout -out public.pem
```

Set `JWT_PRIVATE_KEY_PATH` and `JWT_PUBLIC_KEY_PATH` to the absolute paths of these files.

## Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/YomZsamora/authentication-service.git
cd authentication-service

# 2. Install dependencies
npm install

# 3. Create and configure your .env file
cp .env.example .env
# Edit .env with your values

# 4. Run database migrations (development database)
npx sequelize-cli db:migrate

# 5. Start the development server
npm run dev
```

The service will be available at `http://localhost:<PORT>`. Use Postman or any HTTP client to interact with the API.

## Running Tests

Tests run against a dedicated `POSTGRES_DATABASE_TEST` database. The Jest `globalSetup` creates the database and runs migrations automatically before the suite starts; `globalTeardown` drops it afterwards.

```bash
# Run all tests
npm test
```

```bash
# Run a specific test file
npm test -- --testPathPattern=basic-login
```

```bash
# Run with verbose output
npm test -- --verbose
```

```bash
# Run a single named test
npm test -- --testNamePattern="should return 401"
```

> **Note:** `NODE_ENV=test` is set automatically by the Jest config. Ensure `POSTGRES_DATABASE_TEST` and Redis are reachable before running tests.

## Database Migrations

```bash
# Run pending migrations (development database)
npx sequelize-cli db:migrate

# Run pending migrations (test database)
NODE_ENV=test npx sequelize-cli db:migrate

# Create a new migration
npx sequelize-cli migration:generate --name <description>

# Undo the last migration
npx sequelize-cli db:migrate:undo
```

## How Token Verification Works for Downstream Services

Downstream services (e.g. `entertainment-service`) verify access tokens **locally** using the public key — no runtime call back to this service:

1. Fetch the JWKS document from `/.well-known/jwks.json` (cache it; it only changes on key rotation).
2. Verify the RS256 signature using the `n` and `e` parameters from the JWKS.
3. Check `iss`, `aud`, and `exp` claims.
4. Read `role` from the payload and enforce RBAC on the protected route.

This means token verification adds zero network latency to downstream requests.

## Development

Want to contribute? Here's how:

- Fork the repository
- Create a new branch (`git checkout -b feature/your-feature-name`)
- Make your changes following the conventions in `CLAUDE.md`
- Run the test suite (`npm test`) and confirm all tests pass
- Commit your changes using Conventional Commits (`feat:`, `fix:`, `refactor:`, etc.)
- Push to your branch (`git push origin feature/your-feature-name`)
- Open a Pull Request describing what changed, why it changed, and any migration or environment variable additions required

## Known Bugs

If you encounter any bugs or issues, please open an issue on the [GitHub repository](https://github.com/YomZsamora/authentication-service/issues). Include a description of the issue and the steps to reproduce it.

## License

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
