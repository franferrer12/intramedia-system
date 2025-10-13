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

# Create startup script to transform DATABASE_URL to JDBC format
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo '# Transform Render DATABASE_URL (postgresql://) to JDBC format (jdbc:postgresql://)' >> /app/start.sh && \
    echo 'if [ -n "$DATABASE_URL" ]; then' >> /app/start.sh && \
    echo '  export DB_URL="jdbc:${DATABASE_URL}"' >> /app/start.sh && \
    echo 'fi' >> /app/start.sh && \
    echo 'exec java -Xmx512m -Xms256m -Dserver.port=${PORT:-8080} -jar /app/app.jar "$@"' >> /app/start.sh && \
    chmod +x /app/start.sh

CMD ["/app/start.sh"]
