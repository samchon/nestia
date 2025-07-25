import path from "path";
import ts from "typescript";

import { IReflectImport } from "../structures/IReflectImport";
import { MapUtil } from "../utils/MapUtil";

export namespace ImportAnalyzer {
  export const analyze = (file: ts.SourceFile): IReflectImport[] =>
    file.statements
      .filter(ts.isImportDeclaration)
      .map((imp) => {
        const clause: ts.ImportClause | undefined = imp.importClause;
        if (clause === undefined) return null;
        try {
          // no real position
          // import statement generated by transformer like typia
          imp.moduleSpecifier.getText();
        } catch {
          return null;
        }

        const reflect: IReflectImport = {
          file: normalizePath(
            path.dirname(file.fileName),
            ts.isStringLiteral(imp.moduleSpecifier)
              ? imp.moduleSpecifier.text
              : escapeQuotes(imp.moduleSpecifier.getText()),
          ),
          elements: [],
          default: null,
          asterisk: null,
        };
        if (clause.name) reflect.default = clause.name.getText();
        if (clause.namedBindings === undefined) return reflect;
        else if (ts.isNamedImports(clause.namedBindings))
          reflect.elements = clause.namedBindings.elements.map((e) =>
            e.name.getText(),
          );
        else if (ts.isNamespaceImport(clause.namedBindings))
          reflect.asterisk = clause.namedBindings.name.getText();
        return reflect;
      })
      .filter((r) => r !== null);

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
        defaultImports[0].elements = Array.from(instances).sort();
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

  function escapeQuotes(str: string): string {
    if (str.startsWith("'") && str.endsWith("'")) return str.slice(1, -1);
    else if (str.startsWith('"') && str.endsWith('"')) return str.slice(1, -1);
    return str;
  }

  function normalizePath(root: string, str: string): string {
    if (str.startsWith(".")) return path.resolve(root, str);
    return `node_modules/${str}`;
  }
}
