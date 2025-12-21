import { config } from "dotenv";
import { join } from "path";

// Load .env from project root
config({ path: join(process.cwd(), "..", ".env") });

import { resolve } from "path";

import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log("udi config", process.env);
  console.log(`Server running on http://localhost:${port}`);
}

bootstrap();
