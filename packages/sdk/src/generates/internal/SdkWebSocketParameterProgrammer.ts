import { TypeScriptFactory } from "@nestia/factory";
import ts from "typescript";

import { INestiaProject } from "../../structures/INestiaProject";
import { ITypedWebSocketRoute } from "../../structures/ITypedWebSocketRoute";
import { SdkAliasCollection } from "./SdkAliasCollection";

export namespace SdkWebSocketParameterProgrammer {
  export interface IEntry {
    key: string;
    type: ts.TypeNode;
  }

  export const getEntries = (props: {
    project: INestiaProject;
    route: ITypedWebSocketRoute;
    provider: boolean;
    prefix: boolean;
  }): IEntry[] => {
    const prefix: string = props.prefix ? `${props.route.name}.` : "";
    return [
      ...props.route.pathParameters.map((p) => ({
        key: p.name,
        type: SdkAliasCollection.name(p),
      })),
      ...(props.route.query
        ? [
            {
              key: "query",
              type: TypeScriptFactory.createTypeReferenceNode(`${prefix}Query`),
            },
          ]
        : []),
      ...(props.provider
        ? [
            {
              key: "provider",
              type: TypeScriptFactory.createTypeReferenceNode(
                `${prefix}Provider`,
              ),
            },
          ]
        : []),
    ];
  };

  export const getParameterDeclarations = (props: {
    project: INestiaProject;
    route: ITypedWebSocketRoute;
    provider: boolean;
    prefix: boolean;
  }): ts.ParameterDeclaration[] => {
    const entries: IEntry[] = getEntries(props);
    if (entries.length === 0) return [];
    else if (props.project.config.keyword === true) {
      const typeName: string = props.prefix
        ? `${props.route.name}.Props`
        : "Props";
      const node: ts.TypeNode = props.provider
        ? TypeScriptFactory.createTypeReferenceNode(typeName)
        : TypeScriptFactory.createTypeReferenceNode("Omit", [
            TypeScriptFactory.createTypeReferenceNode(typeName),
            TypeScriptFactory.createLiteralTypeNode(
              TypeScriptFactory.createStringLiteral("provider"),
            ),
          ]);
      return [
        TypeScriptFactory.createParameterDeclaration(
          undefined,
          undefined,
          "props",
          undefined,
          node,
        ),
      ];
    }
    return entries.map((entry) =>
      TypeScriptFactory.createParameterDeclaration(
        undefined,
        undefined,
        entry.key,
        undefined,
        entry.type,
      ),
    );
  };

  export const isPathEmpty = (route: ITypedWebSocketRoute): boolean =>
    route.pathParameters.length === 0 && route.query === null;
}
