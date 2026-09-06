FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY pom.xml .

COPY src ./src

RUN apt-get update \
    && apt-get install -y maven \
    && mvn clean package -DskipTests \
    && rm -rf /var/lib/apt/lists/*

CMD ["sh", "-c", "java -jar target/*.jar"]