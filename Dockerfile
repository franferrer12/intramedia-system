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

# Expose port (Render will override with $PORT)
EXPOSE 8080

# Run application
# Use shell form to allow environment variable expansion
CMD java -Xmx512m -Xms256m -Dserver.port=${PORT:-8080} -jar app.jar
