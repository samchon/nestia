import { Metadata } from "typia/lib/schemas/metadata/Metadata";

import { ITypedApplication } from "../../structures/ITypedApplication";
import { ITypedHttpRoute } from "../../structures/ITypedHttpRoute";
import { StringUtil } from "../../utils/StringUtil";

export namespace SdkHttpCloneReferencer {
  export const replace = (app: ITypedApplication): void => {
    const directory: string = `${app.project.config.output}/structures`;
    for (const route of app.routes)
      if (route.protocol === "http")
        visitRoute({
          directory,
          route,
        });
  };

  const visitRoute = (props: {
    directory: string;
    route: ITypedHttpRoute;
  }): void => {
    const unique: Set<string> = new Set();
    for (const p of props.route.parameters)
      visitType({
        unique,
        metadata: p.metadata,
        name: (name) => (p.type = { name }),
      });
    for (const v of Object.values(props.route.exceptions))
      visitType({
        unique,
        metadata: v.metadata,
        name: (name) => (v.type = { name }),
      });
    visitType({
      unique,
      metadata: props.route.success.metadata,
      name: (name) => (props.route.success.type = { name }),
    });
    props.route.imports = Array.from(unique).map((str) => ({
      file: `${props.directory}/${str}`,
      instances: [str],
    }));
  };

  const visitType = (p: {
    unique: Set<string>;
    metadata: Metadata;
    name: (key: string) => void;
  }): void => {
    const enroll = (key: string) => {
      if (key.length && StringUtil.isImplicit(key) === false)
        p.unique.add(key.split(".")[0]);
    };
    for (const alias of p.metadata.aliases) enroll(alias.name);
    for (const array of p.metadata.arrays) enroll(array.type.name);
    for (const tuple of p.metadata.tuples) enroll(tuple.type.name);
    for (const object of p.metadata.objects) enroll(object.name);
    p.name(p.metadata.getName());
  };
}
