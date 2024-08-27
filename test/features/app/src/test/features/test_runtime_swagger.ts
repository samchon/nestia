import { OpenApi } from "@samchon/openapi";
import typia from "typia";

export const test_runtime_swagger = async (): Promise<void> => {
  const response: Response = await fetch("http://127.0.0.1:37000/api-json");
  const document: OpenApi.IDocument = await response.json();
  typia.assert(document);
};
