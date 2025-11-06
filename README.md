# Spring Boot vs Micronaut — Postgres DB Benchmark

This repo benchmarks two minimal Java services that query a shared PostgreSQL database (`app.users`) to compare startup time and steady‑state HTTP performance:

- `spring-boot-service` — Spring Boot 3 + Spring Data JDBC
- `micronaut-service` — Micronaut 4 + Micronaut Data JDBC

Postgres is provided via Docker Compose with schema/data init SQL, and k6 is used for load testing.

## Architecture at a glance

- Postgres 16 (Docker)
- REST endpoints: `GET /users`, `GET /users/{id}`
- Ports: Spring Boot on 8081, Micronaut on 8082
- DB connection via env vars with sensible defaults (see below)

## Prerequisites

- Docker Desktop (or Docker Engine)
- JDK 21 (Temurin/Adoptium recommended)
- Maven 3.9+
- k6 (load testing)

## Clone and project layout

```sh
git clone <your-fork-or-repo-url>
cd benchmark-workspace
```

Key files:
- `docker-compose.yml` — Postgres with init SQL from `db/init/*.sql`
- `spring-boot-service/` and `micronaut-service/` — Maven projects
- `k6/load-test.js` — k6 scenarios hitting both services
- `k6/k6-results.txt` — captured run output (created after you run k6)

## Start Postgres (Docker Compose)

```sh
docker compose up -d db
```

The container exposes `5432:5432` and runs init scripts from `./db/init`:
- `001_create_schema.sql` creates schema/table
- `002_seed.sql` seeds test rows

Stop and remove with volumes:

```sh
docker compose down -v
```

## Configure database settings (optional)

Both services accept environment variables (defaults shown):

```sh
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=postgres
export DB_SCHEMA=app
export DB_USER=postgres
export DB_PASSWORD=postgres
export DB_POOL_SIZE=10
```

## Build the services

```sh
(cd spring-boot-service && mvn -q -DskipTests clean package)
(cd micronaut-service  && mvn -q -DskipTests clean package)
```

## Run the services

Spring Boot (8081):

```sh
(cd spring-boot-service && mvn spring-boot:run)
```

Micronaut (8082):

```sh
(cd micronaut-service && mvn exec:java -Dexec.mainClass=com.benchmark.micro.Application)
```

Endpoints to verify:
- Spring Boot: http://localhost:8081/users and http://localhost:8081/users/1
- Micronaut:  http://localhost:8082/users and http://localhost:8082/users/1

> Tip: If Micronaut binds to 8080 for any reason, force the port: `-Dmicronaut.server.port=8082`.

## Measure startup time (cold boot)

You can capture coarse startup times using the shell `time` utility and jar runs. Close any running instance first.

Spring Boot:

```sh
cd spring-boot-service
/usr/bin/time -f "Spring Boot cold start: %E (wall), %M KB (max RSS)" \
  mvn -q -DskipTests spring-boot:run
```

Micronaut:

```sh
cd micronaut-service
/usr/bin/time -f "Micronaut cold start: %E (wall), %M KB (max RSS)" \
  mvn -q -DskipTests exec:java -Dexec.mainClass=com.benchmark.micro.Application
```

Both frameworks also log startup times in their banners (look for lines like “Started … in X seconds”). For fair comparisons, run several times, discard outliers, and consider warm vs. cold starts separately.

## Run the k6 benchmark and store results

Run after both apps are healthy:

```sh
SPRING_BASE_URL=http://localhost:8081 \
MICRO_BASE_URL=http://localhost:8082 \
  k6 run k6/load-test.js | tee k6/k6-results.txt
```

What the script does:
- 4 parallel scenarios (list and one‑by‑id for each app)
- 20 iters/s each for 30s (constant‑arrival‑rate)
- Reports latency, throughput, and check pass/fail counts

Interpreting results (example fields you’ll see):
- `http_req_duration`: end‑to‑end latency (avg/med/p90/p95)
- `http_req_failed`: percentage of failed requests (should be 0% if both services are up)
- `checks`: functional checks pass rate

If `http_req_failed=100%`, the apps likely weren’t running or endpoints were incorrect.

## Example results snapshot (from `k6/k6-results.txt`)

The following is an excerpt illustrating the output format. In this particular run, requests failed because the services weren’t reachable, so only the latency plumbing is visible:

```
http_req_duration..........: avg=2.62ms   p(90)=3.93ms   p(95)=5.07ms
http_req_failed............: 100.00% ✓ 2403      ✗ 0
checks.....................: 49.97%  ✓ 1201      ✗ 1202
```

Run again with both services healthy to see meaningful per‑framework latency.

## Comparing Spring Boot vs Micronaut

Guidance based on common characteristics and what this repo measures:

- Startup time and footprint (cold start): Micronaut typically starts faster and uses less memory due to ahead‑of‑time DI and fewer reflection costs.
- Steady‑state throughput/latency: In simple DB‑bound CRUD over JDBC, both frameworks are often comparable; the database usually dominates.
- Ecosystem & productivity: Spring Boot has the most integrations and community. Micronaut is lean and great for microservices/serverless where startup and memory are key.

### Recommendation

- If your priority is minimal cold‑start latency and lower memory (e.g., serverless, many small services): prefer Micronaut.
- If your priority is ecosystem breadth, batteries‑included features, and team familiarity: prefer Spring Boot.

Use the startup timing steps and the captured `k6/k6-results.txt` from your environment to make the decision data‑driven for your workload.

## Troubleshooting

- Micronaut binds to 8080: set `-Dmicronaut.server.port=8082` or verify `src/main/resources/application.yml` is on the classpath.
- k6 shows 100% failures: ensure both apps are running and endpoints match `k6/load-test.js` base URLs.
- DB connection errors: confirm `docker compose ps`, env vars, and that `db/init` ran (table `app.users` exists).

## License

MIT
