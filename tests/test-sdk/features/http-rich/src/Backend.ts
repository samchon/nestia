import core from "@nestia/core";
import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

/**
 * Owns the application shared by all HTTP scenarios.
 *
 * Controllers are stateless and have scenario-specific paths; the same
 * encryption configuration applies to every request in this application.
 *
 * @evidence contracts/common.md#principled-implementation NestFactory loads all nested authored controllers through EncryptedModule.dynamic and binds one caller-selected port. The application remains owned until close completes.
 * @evidence contracts/common.md#clear-and-simple-design One class exposes the open and close lifecycle used by the shared runner; individual scenarios own no application or port.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ordinary Nest factory, dynamic-module and application lifecycle APIs execute the authored controllers without replacing product operations.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies shared stateless controllers, separate paths and common encryption inputs; the runner owns unconditional cleanup.
 */
export class Backend {
  private application_?: INestApplication;

  /**
   * Opens the application's single listener for all scenario requests.
   *
   * @evidence contracts/common.md#principled-implementation The dynamic module recursively loads authored controllers and NestFactory creates their actual application; listen binds the caller-selected port before requests execute.
   * @evidence contracts/common.md#clear-and-simple-design Module creation, application creation and listener readiness form one owned open operation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The public Nest and EncryptedModule operations execute unchanged; the key and port are explicit test inputs.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies listener readiness and shared scenario lifetime; the class comment states controller and encryption assumptions.
   */
  public async open(): Promise<void> {
    this.application_ = await NestFactory.create(
      await core.EncryptedModule.dynamic(__dirname + "/controllers", {
        key: "A".repeat(32),
        iv: "B".repeat(16),
      }),
      { logger: false },
    );
    await this.application_.listen(Number(process.env.TEST_SDK_PORT ?? 37_000));
  }

  /**
   * Releases an opened application; an unopened application needs no work.
   *
   * @evidence contracts/common.md#principled-implementation Awaiting application.close releases Nest-owned listener resources before clearing the retained handle; an absent handle has nothing to release.
   * @evidence contracts/common.md#clear-and-simple-design One close operation handles both the unopened state and normal cleanup; the runner calls it unconditionally in finally.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Cleanup uses the actual application lifecycle and propagates close failures rather than retrying or hiding them.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies the owned resource and the unopened state, and the runner documents unconditional cleanup.
   */
  public async close(): Promise<void> {
    if (this.application_ === undefined) return;

    const app = this.application_;
    await app.close();

    delete this.application_;
  }
}
