import { NestFactory } from "@nestjs/core";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { AppModule } from "./src/app.module";
import * as request from "supertest";

async function runTests() {
  let app: INestApplication | undefined;

  try {
    app = await NestFactory.create(AppModule, { logger: ["error", "warn"] });
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true })
    );
    await app.init();

    console.log("App initialized successfully\n");

    // Test 1: Login
    console.log("Test 1: Login...");
    const loginRes = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ username: "alice", password: process.env.JOINT_PASSWORD });

    if (loginRes.status !== 201) {
      console.error("Login failed:", loginRes.status, loginRes.body);
      process.exit(1);
    }
    console.log("Login response:", loginRes.body);

    const token = loginRes.body.access_token;
    console.log("Token received:", token ? "Yes" : "No");

    // Test 2: Create comment
    console.log("\nTest 2: Create comment...");
    const createRes = await request(app.getHttpServer())
      .post("/api/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({ text_content: "Hello from test", x_coord: 100, y_coord: 200 });

    console.log("Create comment response:", createRes.status, createRes.body);

    // Test 3: Get comments
    console.log("\nTest 3: Get comments...");
    const getRes = await request(app.getHttpServer())
      .get("/api/comments")
      .set("Authorization", `Bearer ${token}`);

    console.log("Get comments response:", getRes.status, getRes.body);

    console.log("\nAll tests completed!");
  } catch (error) {
    console.error("Test error:", error);
  } finally {
    if (app) {
      await app.close();
    }
    process.exit(0);
  }
}

runTests();
