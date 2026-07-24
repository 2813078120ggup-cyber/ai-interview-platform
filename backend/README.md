# Backend

## Start dependencies

From the repository root, start MySQL and Redis with `docker compose up -d`. The MySQL container initializes `docs/database/01-schema_v1.sql` and `docs/database/seed_v1.sql` on first startup.

## Start the service

Set `JWT_SECRET` to a value of at least 32 characters, then run:

```powershell
$env:JWT_SECRET = 'replace-with-a-secret-at-least-32-characters'
cd backend
mvn spring-boot:run
```

The API base URL is `http://localhost:8080/api/v1`. Registering an account assigns the `CANDIDATE` role. Assign `HR` or `INTERVIEWER` roles directly in `user_role` for initial local testing.
