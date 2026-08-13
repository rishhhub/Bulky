FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /workspace

COPY pom.xml ./
COPY bulkby-common/pom.xml bulkby-common/pom.xml
COPY bulkby-auth/pom.xml bulkby-auth/pom.xml
COPY bulkby-catalog/pom.xml bulkby-catalog/pom.xml
COPY bulkby-logistics/pom.xml bulkby-logistics/pom.xml
COPY bulkby-order/pom.xml bulkby-order/pom.xml
COPY bulkby-payment/pom.xml bulkby-payment/pom.xml
COPY bulkby-notification/pom.xml bulkby-notification/pom.xml
COPY bulkby-app/pom.xml bulkby-app/pom.xml

COPY bulkby-common/src bulkby-common/src
COPY bulkby-auth/src bulkby-auth/src
COPY bulkby-catalog/src bulkby-catalog/src
COPY bulkby-logistics/src bulkby-logistics/src
COPY bulkby-order/src bulkby-order/src
COPY bulkby-payment/src bulkby-payment/src
COPY bulkby-notification/src bulkby-notification/src
COPY bulkby-app/src bulkby-app/src

RUN mvn -DskipTests clean package -pl bulkby-app -am

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /workspace/bulkby-app/target/*.jar app.jar
EXPOSE 8080
ENV JAVA_OPTS="-Xmx512m -Xms256m -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS} -jar /app/app.jar --spring.profiles.active=prod"]
