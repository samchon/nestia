import { IReflectImport } from "../structures/IReflectImport";
import { MapUtil } from "../utils/MapUtil";

export namespace ImportAnalyzer {
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
