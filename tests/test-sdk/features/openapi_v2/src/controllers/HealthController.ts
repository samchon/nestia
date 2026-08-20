import core from "@nestia/core";
import { Controller } from "@nestjs/common";

/**
 * Verifies a response declares a body exactly when it has one, in both
 * directions, and that the document still downgrades to Swagger 2.0.
 *
 * Why: a response advertises a media type only when it has a body to describe,
 * and the success response and a declared exception reach that media type by
 * the same route -- so a rule applied to one of them leaves the other emitting
 * the document the first was fixed for. A schemaless media type says "this
 * endpoint replies with JSON" and then declines to say what the JSON is, and
 * the Swagger 2.0 downgrade refuses the whole document over it, which is what
 * made `swagger.openapi: "2.0"` unreachable for this project.
 *
 * 1. Declare a `void` route so the success response has no schema.
 * 2. Declare a `void` exception so one error response has none either.
 * 3. Declare a typed exception beside it, so the twin proves the rule narrows
 *    rather than drops every body, through the 2.0 downgrade this time.
 */
@Controller("health")
export class HealthController {
  @core.TypedException<void>({ status: 400 })
  @core.TypedException<string>({ status: 500 })
  @core.TypedRoute.Get()
  public get(): void {}
}
