# Phase 02: Backend CI — Checkstyle + Docker Build

## Context Links
- Current workflow: `.github/workflows/backend-ci.yml`
- Maven config: `backend/pom.xml`
- Dockerfile: `docker/Dockerfile.backend`

## Overview
- **Priority:** High
- **Status:** Complete
- **Description:** Add Checkstyle static analysis and Docker image build verification to backend CI

## Key Insights
- No Checkstyle plugin in pom.xml — need to add maven-checkstyle-plugin
- Google Java Style is widely adopted, reasonable defaults
- Docker build in CI verifies Dockerfile stays valid — no push needed
- `./mvnw clean verify` already runs tests

## Requirements

### Functional
- Checkstyle runs as part of Maven build (verify phase)
- Docker build succeeds in CI
- Checkstyle violations reported in build output

### Non-functional
- Checkstyle should not be overly strict — start with Google style, warn-only initially
- Docker build adds < 3 min to CI

## Related Code Files

### Modify
- `backend/pom.xml` — add maven-checkstyle-plugin
- `.github/workflows/backend-ci.yml` — add Checkstyle + Docker build steps

### Create
- `backend/checkstyle.xml` — Checkstyle configuration (Google style base)

## Implementation Steps

1. Add maven-checkstyle-plugin to `backend/pom.xml` in `<build><plugins>`:
   ```xml
   <plugin>
       <groupId>org.apache.maven.plugins</groupId>
       <artifactId>maven-checkstyle-plugin</artifactId>
       <version>3.6.0</version>
       <configuration>
           <configLocation>checkstyle.xml</configLocation>
           <consoleOutput>true</consoleOutput>
           <violationSeverity>warning</violationSeverity>
           <failOnViolation>false</failOnViolation>
       </configuration>
       <executions>
           <execution>
               <id>checkstyle-check</id>
               <phase>verify</phase>
               <goals>
                   <goal>check</goal>
               </goals>
           </execution>
       </executions>
   </plugin>
   ```

2. Create `backend/checkstyle.xml` with Google Java Style:
   ```xml
   <?xml version="1.0"?>
   <!DOCTYPE module PUBLIC
       "-//Checkstyle//DTD Checkstyle Configuration 1.3//EN"
       "https://checkstyle.org/dtds/configuration_1_3.dtd">
   <module name="Checker">
       <property name="severity" value="warning"/>
       <module name="TreeWalker">
           <module name="JavadocMethod">
               <property name="severity" value="ignore"/>
           </module>
           <module name="IndentationCheck">
               <property name="basicOffset" value="4"/>
           </module>
           <module name="NeedBraces"/>
           <module name="UnusedImports"/>
           <module name="RedundantImport"/>
       </module>
       <module name="FileLength">
           <property name="max" value="500"/>
       </module>
       <module name="LineLength">
           <property name="max" value="150"/>
       </module>
   </module>
   ```

3. Update `.github/workflows/backend-ci.yml`:
   - Existing: `./mvnw clean verify` (now includes Checkstyle via verify phase)
   - Add Docker build step:
     ```yaml
     - name: Build Docker image
       run: docker build -f docker/Dockerfile.backend -t cookmate-backend:ci ./backend
     ```

## Todo List
- [x] Add maven-checkstyle-plugin to pom.xml
- [x] Create checkstyle.xml config
- [x] Update backend-ci.yml with Docker build step
- [x] Verify `./mvnw clean verify` runs Checkstyle
- [x] Verify Docker build works in CI

## Success Criteria
- `./mvnw clean verify` includes Checkstyle output
- Docker build step completes in CI
- No CI breakage from Checkstyle (failOnViolation=false initially)

## Risk Assessment
- **Checkstyle too strict:** Mitigated with `failOnViolation=false` — warns only, doesn't break build
- **Docker build context:** Dockerfile expects `./backend` context — CI needs correct `-f` and context path
- **Lombok + Checkstyle:** Lombok-generated code may trigger violations — verify suppression

## Security Considerations
- Docker image not pushed to any registry — CI only
- No secrets needed for this phase

## Next Steps
- Phase 3 adds Maven cache + Docker layer caching
- After stabilizing, consider `failOnViolation=true`
