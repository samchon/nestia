import { NestiaProjectTemplate } from "./NestiaProjectTemplate.js";

/**
 * The `nestia template` command: clones the backend template kit and builds it
 * without running its tests.
 *
 * @evidence contracts/common.md#principled-implementation It binds the template kit's title and repository with the test step disabled, so its behavior is exactly the shared flow's with that one difference.
 * @evidence contracts/common.md#clear-and-simple-design A one-member namespace whose only job is naming the bound command that `index.ts` imports lazily.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The values are contract constants (the published template repository URL), not special cases of any consumer.
 * @evidence contracts/common.md#meaningful-documentation The comment names the command and its difference from the starter; the shared flow documents the details.
 */
export namespace NestiaTemplate {
  export const clone = NestiaProjectTemplate.clone({
    title: "Nestia Template Kit",
    repository: "https://github.com/samchon/backend",
    test: false,
  });
}
