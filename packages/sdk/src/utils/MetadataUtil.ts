import { MetadataSchema } from "@typia/core";

export namespace MetadataUtil {
  export const visit = (closure: (m: MetadataSchema) => unknown) => {
    const visited: WeakSet<MetadataSchema> = new WeakSet();
    const iterate = (metadata: MetadataSchema): void => {
      if (visited.has(metadata)) return;
      visited.add(metadata);
      closure(metadata);
      for (const alias of metadata.aliases) iterate(alias.type.value);
      for (const array of metadata.arrays) iterate(array.type.value);
      for (const tuple of metadata.tuples) tuple.type.elements.map(iterate);
      for (const object of metadata.objects)
        object.type.properties.forEach((p) => {
          iterate(p.key);
          iterate(p.value);
        });
      if (metadata.escaped) {
        iterate(metadata.escaped.original);
        iterate(metadata.escaped.returns);
      }
      if (metadata.rest) iterate(metadata.rest);
    };
    return iterate;
  };
}
