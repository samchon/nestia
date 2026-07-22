import core from "@nestia/core";
import { Controller } from "@nestjs/common";

/**
 * Verifies every configurable generator root can create missing parent directories.
 *
 * Why:
 * SDK, E2E, and Swagger outputs are independent configuration roots, so a nested
 * new path must not depend on another generator having created its parents.
 *
 * 1. Configure SDK, E2E, and Swagger under distinct nonexistent nested paths.
 * 2. Generate all artifacts and compile the fixture through the SDK CI lane.
 */
@Controller("health")
export class HealthController {
  @core.TypedRoute.Get()
  public get(): string {
    return "ok";
  }
}
