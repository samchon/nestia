import { IReflectImport } from "../structures/IReflectImport";
import { MapUtil } from "../utils/MapUtil";

/**
 * Helpers for the import lists of routes.
 *
 * @evidence contracts/common.md#principled-implementation The namespace merges the imports collected for one route and keeps a removal notice for the old analysis entry.
 * @evidence contracts/common.md#clear-and-simple-design Two functions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The merge is generic.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation ImportAnalyzer analyzes reflected route metadata; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
 */
export namespace ImportAnalyzer {
  /**
   * @deprecated Removed in the Go-migration cycle. Import metadata is now
   *   attached by the native transformer in
   *   `packages/core/native/cmd/ttsc-nestia` and consumed via
   *   `IOperationMetadata.imports`. Call sites that previously walked a
   *   `ts.SourceFile` to derive imports should read the metadata delivered
   *   through `Reflect.getMetadata("nestia/OperationMetadata", …)` instead. See
   *   `packages/core/MIGRATION.md`.
   * @evidence contracts/common.md#principled-implementation The function exists only to give an actionable error to a caller of the removed API, and always throws.
   * @evidence contracts/common.md#clear-and-simple-design One statement.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It reports the removal instead of failing later with a missing function.
   * @evidence contracts/common.md#meaningful-documentation The comment names the replacement.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation ImportAnalyzer.analyze analyzes reflected route metadata; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const analyze = (): never => {
    throw new Error(
      "ImportAnalyzer.analyze was removed in @nestia/sdk@next. " +
        "Imports are now attached by the native transformer; read them from " +
        "IOperationMetadata.imports (see packages/core/MIGRATION.md).",
    );
  };

  /**
   * Merges import records by file: namespace imports and default imports are
   * deduplicated and sorted, and the named elements of every import of a file
   * are combined with their aliases.
   *
   * @evidence contracts/common.md#principled-implementation Imports are grouped by file, each group emits its namespace imports, default imports, and one element list with an alias map for renamed elements, so the same file is imported once per kind.
   * @evidence contracts/common.md#clear-and-simple-design One function over one group merger.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The merge follows the import records, with no file special-cased.
   * @evidence contracts/common.md#meaningful-documentation The comment states the grouping and the merging.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation ImportAnalyzer.merge analyzes reflected route metadata; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const merge = (imports: IReflectImport[]): IReflectImport[] => {
    // group by files
    const fileGroups: Map<string, IReflectImport[]> = new Map();
    for (const imp of imports) {
      const array: IReflectImport[] = MapUtil.take(
        fileGroups,
        imp.file,
        () => [],
      );
      array.push(imp);
    }
    return Array.from(fileGroups.entries())
      .map(([key, value]) => mergeGroup(key, value))
      .flat();
  };

  function mergeGroup(
    file: string,
    imports: IReflectImport[],
  ): IReflectImport[] {
    const allStarImports: IReflectImport[] = Array.from(
      new Set(
        imports
          .filter((imp) => imp.asterisk !== null)
          .map((imp) => imp.asterisk!),
      ),
    )
      .sort()
      .map(
        (allStarImport) =>
          ({
            file,
            elements: [],
            default: null,
            asterisk: allStarImport,
          }) satisfies IReflectImport,
      );
    const defaultImports: IReflectImport[] = Array.from(
      new Set(
        imports
          .filter((imp) => imp.default !== null)
          .map((imp) => imp.default!),
      ),
    )
      .sort()
      .map(
        (defaultImport) =>
          ({
            file,
            elements: [],
            default: defaultImport,
            asterisk: null,
          }) satisfies IReflectImport,
      );
    const instances: Map<string, string> = new Map();
    for (const imp of imports)
      for (const local of imp.elements)
        instances.set(local, imp.elementAliases?.[local] ?? local);
    if (instances.size !== 0) {
      const elements = Array.from(instances.keys()).sort();
      const elementAliases: Record<string, string> = {};
      for (const local of elements) {
        const imported = instances.get(local)!;
        if (imported !== local) elementAliases[local] = imported;
      }
      const target: IReflectImport = defaultImports[0] ?? {
        file,
        elements: [],
        default: null,
        asterisk: null,
      };
      target.elements = elements;
      if (Object.keys(elementAliases).length !== 0)
        target.elementAliases = elementAliases;
      if (defaultImports.length === 0) defaultImports.push(target);
    }
    return [...allStarImports, ...defaultImports];
  }
}
