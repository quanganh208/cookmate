# Cookmate Deployment Guide

## Local Development

### Prerequisites
- Docker & Docker Compose installed
- Node.js 22.x and pnpm 10.7.0
- Java 21 LTS and Maven 3.9.x (via mvnw wrapper)

### Start Local Environment

```bash
# Clone and install dependencies
git clone https://github.com/cookmate/cookmate.git
cd cookmate
pnpm install

# Start Docker services (MongoDB, API server)
docker compose up -d

# Verify services are running
docker ps
```

### Verify Health

```bash
# MongoDB health check
docker compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# API health check
curl http://localhost:8080/api/health
curl http://localhost:8080/actuator/health
```

### Start Development Servers

**Backend API:**
```bash
cd backend
./mvnw clean install
./mvnw spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"
```

**Mobile App:**
```bash
cd apps/mobile
pnpm start
# Choose: i (iOS simulator), a (Android emulator), or web
```

## Docker Production Build

### Backend Container

**Dockerfile.backend** uses multi-stage build for minimal image size:

```dockerfile
# Stage 1: Build
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /app
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline -B
COPY src/ src/
RUN ./mvnw clean package -DskipTests -B

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine
RUN apk add --no-cache curl
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD curl -sf http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Build command:**
```bash
docker build -f docker/Dockerfile.backend -t cookmate-api:latest .
```

**Run container:**
```bash
docker run -d \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e MONGODB_URI=mongodb://mongodb:27017/cookmate \
  -p 8080:8080 \
  cookmate-api:latest
```

## Environment Configuration

### Spring Boot Profiles

| Profile | Use | MongoDB | Logging |
|---------|-----|---------|---------|
| `dev` | Local development | localhost:27017 | DEBUG |
| `prod` | Production | env var | WARN |

**Select profile:**
```bash
# Via command line
./mvnw spring-boot:run -Dspring.profiles.active=dev

# Via environment variable
export SPRING_PROFILES_ACTIVE=prod
./mvnw spring-boot:run

# Via Docker
docker run -e SPRING_PROFILES_ACTIVE=prod cookmate-api
```

### Environment Variables

**Required for production:**
```bash
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/cookmate
SPRING_PROFILES_ACTIVE=prod
SERVER_PORT=8080
LOG_LEVEL=WARN
```

**Optional:**
```bash
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION_MS=3600000
MAX_UPLOAD_SIZE=10485760  # 10MB
CORS_ALLOWED_ORIGINS=https://cookmate.com,https://app.cookmate.com
```

### Load Configuration

**application-dev.yml:**
```yaml
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/cookmate
logging:
  level:
    root: DEBUG
```

**application-prod.yml:**
```yaml
spring:
  data:
    mongodb:
      uri: ${MONGODB_URI}
logging:
  level:
    root: WARN
server:
  port: ${SERVER_PORT:8080}
```

## Health Checks

### Spring Boot Actuator

**Enabled by default** via `spring-boot-starter-actuator`.

**Endpoints:**
```bash
# Health check (liveness & readiness)
GET /actuator/health

# Response:
{
  "status": "UP",
  "components": {
    "mongoDb": { "status": "UP" },
    "diskSpace": { "status": "UP" }
  }
}

# All metrics
GET /actuator

# Custom health (if implemented)
GET /api/health
```

**Configure probes:**
```properties
# liveness (is app running?)
management.endpoint.health.probes.enabled=true
management.health.livenessState.enabled=true

# readiness (is app ready for traffic?)
management.health.readinessState.enabled=true
```

## Troubleshooting

### Port Conflicts
```bash
# MongoDB already running
lsof -i :27017 | grep LISTEN
kill -9 <PID>

# API server port taken
lsof -i :8080 | grep LISTEN
```

### MongoDB Connection Issues
```bash
# Verify MongoDB is running
docker ps | grep mongodb

# Check logs
docker logs cookmate-mongodb

# Test connection
docker run --rm --network cookmate-network \
  mongo:8.0 mongosh -u admin -p password mongodb://mongodb:27017
```

### Java Version Mismatch
```bash
# Verify Java 21 is in use
java -version
# Should show: openjdk version "21.x.x"

# If not, set JAVA_HOME
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
```

### Dependency Build Failures
```bash
# Clear Maven cache
rm -rf ~/.m2/repository
./mvnw clean install

# Check for SNAPSHOT versions
./mvnw dependency:tree
```

### API Not Responding
```bash
# Check if service is listening
netstat -tlnp | grep 8080

# View logs
docker logs cookmate-api

# Test endpoint
curl -v http://localhost:8080/actuator/health
```

## CI/CD Pipelines

See `.github/workflows/`:
- **frontend-ci.yml** — Lint, test, build mobile (runs on PR/push)
- **backend-ci.yml** — Maven tests, Checkstyle, build JAR (runs on PR/push)

Status: Basic pipelines in place. TODO: Add deployment steps (Docker push, Kubernetes deploy).

## Production Checklist

- [ ] MongoDB replica set configured (for production)
- [ ] HTTPS/TLS enabled (nginx reverse proxy)
- [ ] Environment variables set securely (secrets manager)
- [ ] Backups configured (MongoDB Atlas or backup service)
- [ ] Monitoring and alerting set up (CloudWatch, DataDog, etc.)
- [ ] Load testing completed
- [ ] Disaster recovery plan documented
