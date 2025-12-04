FROM gradle:8.5.0-jdk17 AS builder

WORKDIR /app

COPY build.gradle settings.gradle gradlew ./
COPY gradle ./gradle

# 下载依赖（可选，但推荐）
RUN ./gradlew dependencies --no-daemon

COPY src ./src

RUN ./gradlew build --no-daemon --stacktrace

FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=builder /app/build/libs/glyphz-0.0.1.jar glyphz-0.0.1.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "glyphz-0.0.1.jar"]
