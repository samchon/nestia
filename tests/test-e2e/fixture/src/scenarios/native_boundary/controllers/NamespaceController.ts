import core from "@nestia/core";
import { Controller } from "@nestjs/common";

/**
 * Contains the original North duplicate-controller site.
 *
 * @evidence contracts/common.md#principled-implementation The original namespace parent distinguishes this AST method from the same class/method spelling in its sibling.
 * @evidence contracts/common.md#clear-and-simple-design One namespaced class and exported controller alias retain the original discovery path.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Original source declarations and public decorators retain their meaning; no fabricated metadata or name-dependent product branches are used.
 * @evidence contracts/common.md#meaningful-documentation The comment states the source distinction this compiled input preserves.
 */
export namespace North {
  /**
   * Exposes the original north duplicate route.
   *
   * @evidence contracts/common.md#principled-implementation The original same-named DuplicateController belongs to this namespace and carries its own route literal.
   * @evidence contracts/common.md#clear-and-simple-design One controller isolates its distinct source site.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Original source declarations and public decorators retain their meaning; no fabricated metadata or name-dependent product branches are used.
   * @evidence contracts/common.md#meaningful-documentation The comment states the source distinction this compiled input preserves.
   */
  @Controller("native_boundary/north")
  export class DuplicateController {
    @core.TypedRoute.Get("duplicate")
    /**
     * Returns the original north value.
     *
     * @evidence contracts/common.md#principled-implementation Distinct namespace source identity must keep this independently decorated route in generated Swagger.
     * @evidence contracts/common.md#clear-and-simple-design One stateless return supplies its original literal.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Original source declarations and public decorators retain their meaning; no fabricated metadata or name-dependent product branches are used.
     * @evidence contracts/common.md#meaningful-documentation The comment states the source distinction this compiled input preserves.
     */
    public duplicate(): string {
      return "north";
    }
  }
}

/**
 * Contains the original South duplicate-controller site.
 *
 * @evidence contracts/common.md#principled-implementation The original namespace parent distinguishes this AST method from the same class/method spelling in its sibling.
 * @evidence contracts/common.md#clear-and-simple-design One namespaced class and exported controller alias retain the original discovery path.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Original source declarations and public decorators retain their meaning; no fabricated metadata or name-dependent product branches are used.
 * @evidence contracts/common.md#meaningful-documentation The comment states the source distinction this compiled input preserves.
 */
export namespace South {
  /**
   * Exposes the original south duplicate route.
   *
   * @evidence contracts/common.md#principled-implementation The original same-named DuplicateController belongs to this namespace and carries its own route literal.
   * @evidence contracts/common.md#clear-and-simple-design One controller isolates its distinct source site.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Original source declarations and public decorators retain their meaning; no fabricated metadata or name-dependent product branches are used.
   * @evidence contracts/common.md#meaningful-documentation The comment states the source distinction this compiled input preserves.
   */
  @Controller("native_boundary/south")
  export class DuplicateController {
    @core.TypedRoute.Get("duplicate")
    /**
     * Returns the original south value.
     *
     * @evidence contracts/common.md#principled-implementation Distinct namespace source identity must keep this independently decorated route in generated Swagger.
     * @evidence contracts/common.md#clear-and-simple-design One stateless return supplies its original literal.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Original source declarations and public decorators retain their meaning; no fabricated metadata or name-dependent product branches are used.
     * @evidence contracts/common.md#meaningful-documentation The comment states the source distinction this compiled input preserves.
     */
    public duplicate(): string {
      return "south";
    }
  }
}

// Config discovery receives exported controller values, while the AST method
// declarations retain their DuplicateController namespace parents.
export const NorthController = North.DuplicateController;
export const SouthController = South.DuplicateController;
