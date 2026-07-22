import { IReflectImport } from "../structures/IReflectImport";
import { MapUtil } from "../utils/MapUtil";

export namespace ImportAnalyzer {
  /**
   * @deprecated Removed in the Go-migration cycle. Import metadata is now
   *   attached by the native transformer in
   *   `packages/core/native/cmd/ttsc-nestia` and consumed via
   *   `IOperationMetadata.imports`. Call sites that previously walked a
   *   `ts.SourceFile` to derive imports should read the metadata delivered
   *   through `Reflect.getMetadata("nestia/OperationMetadata", …)` instead. See
   *   `packages/core/MIGRATION.md`.
   */
  export const analyze = (): never => {
    throw new Error(
      "ImportAnalyzer.analyze was removed in @nestia/sdk@next. " +
        "Imports are now attached by the native transformer; read them from " +
        "IOperationMetadata.imports (see packages/core/MIGRATION.md).",
    );
  };

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
      const target: IReflectImport =
        defaultImports[0] ?? {
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
