import {
  type Expression,
  type Node,
  SyntaxKind,
  type TypeNode,
  factory,
} from "@ttsc/factory";

import { INestiaProject } from "../../structures/INestiaProject";
import { ITypedHttpRoute } from "../../structures/ITypedHttpRoute";
import { ITypedHttpRouteParameter } from "../../structures/ITypedHttpRouteParameter";
import { StringUtil } from "../../utils/StringUtil";
import { ImportDictionary } from "./ImportDictionary";
import { SdkAliasCollection } from "./SdkAliasCollection";

export namespace SdkHttpParameterProgrammer {
  export interface IEntry {
    key: string;
    required: boolean;
    type: TypeNode;
    parameter: ITypedHttpRouteParameter;
  }

  /**
   * The identifiers one route's SDK function, `path()`, and `simulate()` use,
   * decided once so the three cannot disagree.
   *
   * A user parameter shares those scopes with identifiers the SDK writes: its
   * own `connection` and `props` parameters and locals, and names it cannot
   * change — the route's function and namespace, which are public, and the
   * imports, namespace members, and globals the bodies reference. Nothing kept
   * them apart, so a parameter named like its method or `connection` produced
   * an SDK that does not compile (#1647).
   *
   * The SDK's own identifiers are escaped with `_` prefixes, as it already
   * escaped `output` and `variables`. A user parameter keeps its name, which an
   * IDE shows and which is a `props` key in keyword mode, unless the name is
   * one the SDK cannot change; then the positional parameter alone is renamed,
   * which positional callers never see. The fixed names are only those the
   * generated code actually references for this route and configuration, so a
   * route without a collision is written exactly as before.
   */
  export interface INames {
    connection: string;
    props: string;
    output: string;
    assert: string;
    variables: string;
    location: string;
    key: string;
    value: string;
    elem: string;

    /** Local identifier of a significant parameter in positional mode. */
    parameter: (p: ITypedHttpRouteParameter) => string;

    /** Reads a significant parameter: `props.<name>` or its local. */
    access: (p: ITypedHttpRouteParameter) => Expression;
  }

  export const getNames = (props: {
    project: INestiaProject;
    route: ITypedHttpRoute;
  }): INames => {
    const { project, route } = props;
    const parameters: ITypedHttpRouteParameter[] = getSignificant(route, true);
    const simulate: boolean =
      project.config.simulate === true && parameters.length !== 0;

    // names each scope references and the SDK cannot change
    const functional: string[] = [
      route.name,
      !!route.body?.encrypted || route.success.encrypted
        ? "EncryptedFetcher"
        : "PlainFetcher",
      ...(project.config.assert === true ? ["typia"] : []),
      ...(route.success.setHeaders.some((h) => h.type === "assigner")
        ? ["Object"]
        : []),
    ];
    const path: string[] = [
      ...(route.pathParameters.length !== 0 ? ["encodeURIComponent"] : []),
      ...(route.queryObject !== null || route.queryParameters.length !== 0
        ? ["URLSearchParams", "Object", "Array", "String", "undefined"]
        : []),
    ];
    const simulation: string[] = simulate
      ? ["NestiaSimulator", "METADATA", "path", "random", "typia"]
      : [];

    const locals: Map<ITypedHttpRouteParameter, string> = new Map();
    if (project.config.keyword !== true)
      for (const p of parameters)
        locals.set(
          p,
          StringUtil.escapeDuplicate([
            ...functional,
            ...simulation,
            ...(p.category !== "body" ? path : []),
            ...parameters.filter((q) => q !== p).map((q) => q.name),
            ...locals.values(),
          ])(p.name),
        );
    const own =
      (fixed: string[], taken: string[]) =>
      (name: string): string => {
        const escaped: string = StringUtil.escapeDuplicate([
          ...fixed,
          ...locals.values(),
          ...taken,
        ])(name);
        taken.push(escaped);
        return escaped;
      };
    const shared: string[] = [];
    const $props: string = own(
      [...functional, ...path, ...simulation],
      shared,
    )("props");
    const $connection: string = own(
      [...functional, ...simulation],
      shared,
    )("connection");
    const inPath = own(path, [...shared]);
    const names: Omit<INames, "parameter" | "access"> = {
      props: $props,
      connection: $connection,
      output: own(functional, [...shared])("output"),
      assert: own(simulation, [...shared])("assert"),
      variables: inPath("variables"),
      location: inPath("location"),
      key: inPath("key"),
      value: inPath("value"),
      elem: inPath("elem"),
    };
    return {
      ...names,
      parameter: (p) => locals.get(p) ?? p.name,
      access: (p) =>
        project.config.keyword === true
          ? factory.createPropertyAccessExpression(
              factory.createIdentifier(names.props),
              p.name,
            )
          : factory.createIdentifier(locals.get(p) ?? p.name),
    };
  };

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
    const names: INames = getNames(props);
    if (props.project.config.keyword === true) {
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
          names.props,
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
        names.parameter(e.parameter),
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
    const names: INames = getNames(props);
    if (props.project.config.keyword === true)
      return [factory.createIdentifier(names.props)];
    return parameters.map((p) => factory.createIdentifier(names.parameter(p)));
  };
}
