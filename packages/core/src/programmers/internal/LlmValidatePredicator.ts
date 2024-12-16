import { ILlmSchema } from "@samchon/openapi";

import { INestiaTransformOptions } from "../../options/INestiaTransformOptions";

export namespace LlmValidatePredicator {
  export const is = <Model extends ILlmSchema.Model>(
    llm: INestiaTransformOptions.ILlm<Model> | undefined,
  ): llm is INestiaTransformOptions.ILlm<Model> => {
    if (llm?.model === undefined) return false;
    else if (llm.model === "chatgpt") return llm.strict === true;
    else if (llm.model === "gemini") return true;
    else if (llm.model === "3.0")
      return llm.recursive === false || llm.recursive === 0;
    return false;
  };
}
