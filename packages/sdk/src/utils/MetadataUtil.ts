import { Metadata as metadata } from "typia/lib/schemas/metadata/Metadata";

export namespace MetadataUtil {
  export const visit = (closure: (m: metadata) => unknown) => {
    const visited: WeakSet<metadata> = new WeakSet();
    const iterate = (metadata: metadata): void => {
      if (visited.has(metadata)) return;
      visited.add(metadata);
      closure(metadata);
      for (const alias of metadata.aliases) iterate(alias.value);
      for (const array of metadata.arrays) iterate(array.type.value);
      for (const tuple of metadata.tuples) tuple.type.elements.map(iterate);
      for (const object of metadata.objects)
        object.properties.forEach((p) => {
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
