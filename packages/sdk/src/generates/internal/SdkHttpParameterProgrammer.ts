import { type Node, SyntaxKind, type TypeNode, factory } from "@ttsc/factory";

import { INestiaProject } from "../../structures/INestiaProject";
import { ITypedHttpRoute } from "../../structures/ITypedHttpRoute";
import { ITypedHttpRouteParameter } from "../../structures/ITypedHttpRouteParameter";
import { ImportDictionary } from "./ImportDictionary";
import { SdkAliasCollection } from "./SdkAliasCollection";

export namespace SdkHttpParameterProgrammer {
  export interface IEntry {
    key: string;
    required: boolean;
    type: TypeNode;
    parameter: ITypedHttpRouteParameter;
  }

  export const getAll = (
    route: ITypedHttpRoute,
  ): ITypedHttpRouteParameter[] => [
    ...route.pathParameters,
    ...route.queryParameters,
    ...route.headerParameters,
    ...(route.queryObject ? [route.queryObject] : []),
    ...(route.body ? [route.body] : []),
    ...(route.headerObject ? [route.headerObject] : []),
  ];

  export const getSignificant = (route: ITypedHttpRoute, body: boolean) => [
    ...route.pathParameters,
    ...route.queryParameters,
    ...(route.queryObject ? [route.queryObject] : []),
    ...(body && route.body ? [route.body] : []),
  ];

  export const getEntries = (props: {
    project: INestiaProject;
    importer: ImportDictionary;
    route: ITypedHttpRoute;
    body: boolean;
    prefix: boolean | string;
    e2e?: boolean;
  }): IEntry[] => {
    if (
      props.route.pathParameters.length === 0 &&
      props.route.queryParameters.length === 0 &&
      props.route.queryObject === null &&
      (props.body === false || props.route.body === null)
    )
      return [];
    const prefix =
      typeof props.prefix === "string"
        ? props.prefix
        : props.prefix === true
          ? `${props.route.name}.`
          : "";
    return [
      ...[...props.route.pathParameters, ...props.route.queryParameters].map(
        (p) => ({
          key: p.name,
          required: p.metadata.required,
          type:
            props.project.config.clone === true
              ? SdkAliasCollection.from(props.project)(props.importer)(
                  p.metadata,
                )
              : SdkAliasCollection.name(p),
          parameter: p,
        }),
      ),
      ...(props.route.queryObject
        ? [
            {
              key: props.route.queryObject.name,
              required: props.route.queryObject.metadata.required,
              type:
                props.e2e === true
                  ? props.project.config.clone === true
                    ? SdkAliasCollection.from(props.project)(props.importer)(
                        props.route.queryObject.metadata,
                      )
                    : SdkAliasCollection.name(props.route.queryObject)
                  : factory.createTypeReferenceNode(`${prefix}Query`),
              parameter: props.route.queryObject,
            },
          ]
        : []),
      ...(props.body && props.route.body
        ? [
            {
              key: props.route.body.name,
              required: props.route.body.metadata.required,
              type:
                props.e2e === true
                  ? props.project.config.clone === true
                    ? SdkAliasCollection.from(props.project)(props.importer)(
                        props.route.body.metadata,
                      )
                    : SdkAliasCollection.name(props.route.body)
                  : factory.createTypeReferenceNode(`${prefix}Body`),
              parameter: props.route.body,
            },
          ]
        : []),
    ];
  };

  export const getParameterDeclarations = (props: {
    project: INestiaProject;
    importer: ImportDictionary;
    route: ITypedHttpRoute;
    body: boolean;
    prefix: boolean;
  }): Node[] => {
    const entries: IEntry[] = getEntries(props);
    if (entries.length === 0) return [];
    else if (props.project.config.keyword === true) {
      const typeName: string = props.prefix
        ? `${props.route.name}.Props`
        : "Props";
      const node: TypeNode =
        props.body === false && props.route.body !== null
          ? factory.createTypeReferenceNode("Omit", [
              factory.createTypeReferenceNode(typeName),
              factory.createLiteralTypeNode(
                factory.createStringLiteral(props.route.body.name),
              ),
            ])
          : factory.createTypeReferenceNode(typeName);
      return [
        factory.createParameterDeclaration(
          undefined,
          undefined,
          "props",
          undefined,
          node,
          undefined,
        ),
      ];
    }
    return entries.map((e) =>
      factory.createParameterDeclaration(
        undefined,
        undefined,
        e.key,
        e.required ? undefined : factory.createToken(SyntaxKind.QuestionToken),
        e.type,
        undefined,
      ),
    );
  };

  export const getArguments = (props: {
    project: INestiaProject;
    route: ITypedHttpRoute;
    body: boolean;
  }): Node[] => {
    const parameters = getSignificant(props.route, props.body);
    if (parameters.length === 0) return [];
    else if (props.project.config.keyword === true)
      return [factory.createIdentifier("props")];
    return parameters.map((p) => factory.createIdentifier(p.name));
  };
}
