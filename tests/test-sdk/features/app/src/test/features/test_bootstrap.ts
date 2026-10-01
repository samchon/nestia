import { TestValidator } from "@nestia/e2e";
import { NestiaSwaggerComposer } from "@nestia/sdk";
import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule } from "@nestjs/swagger";

class ApplicationModule {}

/**
 * Verifies bootstrap through its actual consumer boundary.
 *
 * Authored request values and controller contracts supply observable
 * expectations.
 *
 * 1. Run each retained request or composition scenario.
 * 2. Assert its payload, status or rejection and release any owned host.
 *
 * @evidence contracts/testing.md#behavioral-verification The public composer document is passed to Nest SwaggerModule and the actual /api-json endpoint must return HTTP200, empty paths and the submitted document without changes.
 * @evidence contracts/testing.md#independent-expectations An authored empty module has no route paths, establishing independent empty-object expectation. Document equality is a transport/setup invariant; it does not independently certify all composed fields.
 * @evidence contracts/testing.md#distinguishing-cases This owns empty-application Swagger registration and actual endpoint publication. The nonempty runtime document and rejected operation metadata are sibling cases.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by its feature DynamicExecutor after real generation and compilation; every retained assertion rejection fails the feature report.
 * @evidence contracts/e2e.md#necessary-boundary This connects public NestiaSwaggerComposer, Nest SwaggerModule setup and real HTTP publication; merely composing an object cannot establish the registered endpoint serves it.
 * @evidence contracts/e2e.md#shared-execution Consumer packages and runtime compilation are shared with sibling feature cases and compatible cohorts. Separate preparation inside this case exists only for the explicitly described host boundary; native dispatch and Node processes are shared while each member keeps its own compiler programs and metadata scope.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity One additional ephemeral-port application is necessary for the empty-module distinction; it shares the installed packages/runtime with other app feature cases and finally closes after composition, setup, fetch or assertion failure.
 * @evidence contracts/e2e.md#preserved-coverage All original meaningful requests and composition connections remain. Exact payload/default/path or diagnostic assertions strengthen previously shape-only, completion-only or generic-rejection checks; complementary sibling scenarios remain executable.
 */
export const test_bootstrap = async (): Promise<void> => {
  const app: INestApplication = await NestFactory.create(ApplicationModule);
  try {
    const document = await NestiaSwaggerComposer.document(app, {});
    SwaggerModule.setup("api", app, document as any);
    await app.listen(0, "127.0.0.1");
    const response = await fetch(`${await app.getUrl()}/api-json`);
    TestValidator.equals("swagger endpoint status", response.status, 200);
    const published = await response.json();
    TestValidator.equals("empty application paths", published.paths, {});
    TestValidator.equals("published document", published, document);
  } finally {
    await app.close();
  }
};
