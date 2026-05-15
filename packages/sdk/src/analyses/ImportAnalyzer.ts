import { IReflectImport } from "../structures/IReflectImport";
import { MapUtil } from "../utils/MapUtil";

export namespace ImportAnalyzer {
  /**
   * @deprecated Removed in the Go-migration cycle. Import metadata is now
   * attached by the native transformer in `packages/core/native/cmd/ttsc-nestia`
   * and consumed via `IOperationMetadata.imports`. Call sites that previously
   * walked a `ts.SourceFile` to derive imports should read the metadata
   * delivered through `Reflect.getMetadata("nestia/OperationMetadata", …)`
   * instead. See `packages/core/MIGRATION.md`.
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
    const instances: Set<string> = new Set(
      imports.map((imp) => imp.elements).flat(),
    );
    if (instances.size !== 0) {
      if (defaultImports.length !== 0)
        defaultImports[0]!.elements = Array.from(instances).sort();
      else
        defaultImports.push({
          file,
          elements: Array.from(instances).sort(),
          default: null,
          asterisk: null,
        });
    }
    return [...allStarImports, ...defaultImports];
  }

}
