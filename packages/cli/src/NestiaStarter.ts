import { NestiaProjectTemplate } from "./NestiaProjectTemplate.js";

/**
 * The `nestia start` command: clones the Nestia starter kit, builds it, and
 * runs its tests.
 *
 * @evidence contracts/common.md#principled-implementation It binds the starter kit's title and repository and enables the test step, which is all that distinguishes it from the template command, so its behavior is exactly the shared flow's.
 * @evidence contracts/common.md#clear-and-simple-design A one-member namespace whose only job is naming the bound command that `index.ts` imports lazily.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The values are contract constants (the published starter repository URL), not special cases of any consumer.
 * @evidence contracts/common.md#meaningful-documentation The comment names the command and what it does; the shared flow documents the details.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation This namespace supplies a title, repository URL and test flag to the shared scaffolder; it does not launch processes or interpret native paths.
 */
export namespace NestiaStarter {
  export const clone = NestiaProjectTemplate.clone({
    title: "Nestia Starter Kit",
    repository: "https://github.com/samchon/nestia-start",
    test: true,
  });
}
