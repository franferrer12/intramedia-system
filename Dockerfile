# Multi-stage build for Club Management Backend
# Stage 1: Build
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

# Copy backend code
COPY backend/pom.xml .
COPY backend/src ./src

# Build application (using Maven directly, no wrapper needed)
RUN mvn clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# Copy database URL parser script
COPY parse-db-url.sh /app/parse-db-url.sh
RUN chmod +x /app/parse-db-url.sh

# Expose port (Render will override with $PORT)
EXPOSE 8080

# Start script: parse DATABASE_URL and launch Spring Boot
CMD ["/bin/sh", "-c", ". /app/parse-db-url.sh && exec java -Xmx512m -Xms256m -Dserver.port=${PORT:-8080} -jar /app/app.jar"]
