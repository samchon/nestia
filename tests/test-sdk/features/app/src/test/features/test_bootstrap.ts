import { TestValidator } from "@nestia/e2e";
import { NestiaSwaggerComposer } from "@nestia/sdk";
import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule } from "@nestjs/swagger";

class ApplicationModule {}

/**
 * Verifies creates an empty Nest application, composes its document, checks
 * empty paths and installs SwaggerModule.
 *
 * An application without controllers contributes no OpenAPI paths; setup must
 * accept the public composed document.
 *
 * 1. Execute the authored feature through its prepared generated artifacts.
 * 2. Assert the distinctions described below.
 */
export const test_bootstrap = async (): Promise<void> => {
  const app: INestApplication = await NestFactory.create(ApplicationModule);
  try {
    const document = await NestiaSwaggerComposer.document(app, {});
    TestValidator.equals("empty application paths", document.paths, {});
    SwaggerModule.setup("api", app, document as any);
  } finally {
    await app.close();
  }
};
