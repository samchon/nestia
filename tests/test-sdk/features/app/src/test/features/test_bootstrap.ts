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
 *
 * @evidence contracts/testing.md#behavioral-verification Creates an empty Nest application, composes its document, checks empty paths and installs SwaggerModule.
 * @evidence contracts/testing.md#independent-expectations An application without controllers contributes no OpenAPI paths; setup must accept the public composed document.
 * @evidence contracts/testing.md#distinguishing-cases The empty application boundary is asserted; populated runtime Swagger is owned by the sibling runtime test.
 * @evidence contracts/testing.md#execution-ownership The exported case is discovered by the feature src/test/index.ts after start.js compiles the generated consumer; compiler and host preparation make this an E2E population.
 * @evidence contracts/e2e.md#necessary-boundary Creates an empty Nest application, composes its document, checks empty paths and installs SwaggerModule. The assertion observes generated output or its connected consumer, rather than a committed repository arrangement.
 * @evidence contracts/e2e.md#shared-execution The feature runner shares generation and prepared artifacts with its sibling cases. Compatible programs are batched by start.js; distinct feature programs still incur separate consumer/host preparation, which is an unresolved suite consolidation limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This case consumes the feature-specific generated artifacts and connection; local connector, application or temporary consumer cleanup is owned by its try/finally where created. Outer backend lifecycle belongs to the feature entry and exceptional startup cleanup remains a harness limitation.
 * @evidence contracts/e2e.md#preserved-coverage The empty application boundary is asserted; populated runtime Swagger is owned by the sibling runtime test. Existing assertions remain at this executable owner; no branch is removed or claimed to be transferred to units.
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
