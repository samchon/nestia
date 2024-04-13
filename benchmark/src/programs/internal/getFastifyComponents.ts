import typia from "typia";

export const getFastifyComponents = (doc: typia.IJsonApplication<"3.0">) => {
  const output: Record<string, any> = {};
  for (const [key, value] of Object.entries(doc.components.schemas ?? {})) {
    const $id: string = `#/components/schemas/${key}`;
    output[$id] = { ...value, $id };
  }
  return output;
};
