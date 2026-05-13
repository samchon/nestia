import { NestiaSwaggerComposer } from "@nestia/sdk";
import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule } from "@nestjs/swagger";

class ApplicationModule {}

export const test_bootstrap = async (): Promise<void> => {
  const app: INestApplication = await NestFactory.create(ApplicationModule);
  try {
    const document = await NestiaSwaggerComposer.document(app, {});
    SwaggerModule.setup("api", app, document as any);
  } finally {
    await app.close();
  }
};
