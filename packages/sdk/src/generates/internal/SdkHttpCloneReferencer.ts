import { MetadataSchema, nameOf } from "../../internal/legacy";
import { IReflectType } from "../../structures/IReflectType";
import { ITypedApplication } from "../../structures/ITypedApplication";
import { ITypedHttpRoute } from "../../structures/ITypedHttpRoute";
import { ITypedWebSocketRoute } from "../../structures/ITypedWebSocketRoute";
import { StringUtil } from "../../utils/StringUtil";
import { SdkHttpParameterProgrammer } from "./SdkHttpParameterProgrammer";
import { SdkWebSocketCloneProgrammer } from "./SdkWebSocketCloneProgrammer";

export namespace SdkHttpCloneReferencer {
  export const replace = (
    app: ITypedApplication,
    websocket: Set<string> = new Set(),
  ): void => {
    const directory: string = `${app.project.config.output}/structures`;
    for (const route of app.routes)
      if (route.protocol === "http")
        visitHttpRoute({
          directory,
          route,
        });
      else if (route.protocol === "websocket")
        visitWebSocketRoute({
          cloned: websocket,
          directory,
          route,
        });
  };

  const visitHttpRoute = (props: {
    directory: string;
    route: ITypedHttpRoute;
  }): void => {
    const unique: Set<string> = new Set();
    for (const p of SdkHttpParameterProgrammer.getSignificant(
      props.route,
      true,
    ))
      visitType({
        unique,
        metadata: p.metadata,
        type: p.type,
        name: (name) => (p.type = { name }),
      });
    for (const v of Object.values(props.route.exceptions))
      visitType({
        unique,
        metadata: v.metadata,
        type: v.type,
        name: (name) => (v.type = { name }),
      });
    if (props.route.success.binary === false)
      visitType({
        unique,
        metadata: props.route.success.metadata,
        type: props.route.success.type,
        name: (name) => (props.route.success.type = { name }),
      });
    props.route.imports = Array.from(unique).map((str) => ({
      file: `${props.directory}/${str}`,
      asterisk: null,
      default: null,
      elements: [str],
    }));
  };

  const visitWebSocketRoute = (props: {
    cloned: Set<string>;
    directory: string;
    route: ITypedWebSocketRoute;
  }): void => {
    const unique: Map<string, string> = new Map();
    const keep: ITypedWebSocketRoute["imports"] = [];
    for (const imp of props.route.imports) {
      const cloned: string[] = SdkWebSocketCloneProgrammer.isNodeModulesPath(
        imp.file,
      )
        ? []
        : imp.elements.filter((elem) => {
            const imported: string = imp.elementAliases?.[elem] ?? elem;
            return props.cloned.has(
              SdkWebSocketCloneProgrammer.importKey(imp.file, imported),
            );
          });
      const remained: string[] = imp.elements.filter(
        (elem) => cloned.includes(elem) === false,
      );
      for (const elem of cloned)
        unique.set(elem, imp.elementAliases?.[elem] ?? elem);
      if (
        imp.asterisk !== null ||
        imp.default !== null ||
        remained.length !== 0
      )
        keep.push({
          ...imp,
          elements: remained,
        });
    }

    props.route.imports = [
      ...keep,
      ...Array.from(unique).map(([local, imported]) => ({
        file: `${props.directory}/${imported}`,
        asterisk: null,
        default: null,
        elements: [local],
        ...(local === imported
          ? {}
          : { elementAliases: { [local]: imported } }),
      })),
    ];
  };

  const visitType = (p: {
    unique: Set<string>;
    metadata: MetadataSchema;
    type: IReflectType;
    name: (key: string) => void;
  }): void => {
    const enroll = (key: string) => {
      if (key.length && StringUtil.isImplicit(key) === false)
        p.unique.add(key.split(".")[0]!);
    };
    for (const alias of p.metadata.aliases) enroll(alias.type!.name);
    for (const array of p.metadata.arrays) enroll(array.type!.name);
    for (const tuple of p.metadata.tuples) enroll(tuple.type!.name);
    for (const object of p.metadata.objects) enroll(object.type!.name);
    p.name(nameOf(p.metadata));
  };
}

const getFullText = (type: IReflectType): string =>
  type.typeArguments === undefined
    ? type.name
    : `${type.name}<${type.typeArguments.map(getFullText).join(", ")}>`;
