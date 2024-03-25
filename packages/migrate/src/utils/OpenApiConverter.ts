import V2_0Converter from "swagger2openapi";
import typia from "typia";

import { Converter as V3_1Converter } from "@apiture/openapi-down-convert";

import { ISwagger } from "../structures/ISwagger";
import { ISwaggerV20 } from "../structures/ISwaggerV20";
import { ISwaggerV31 } from "../structures/ISwaggerV31";

export namespace OpenApiConverter {
  export const v2_0 = async (swagger: ISwaggerV20): Promise<ISwagger> => {
    const output = await V2_0Converter.convertObj(swagger, {});
    return typia.assert<ISwagger>(output.openapi);
  };

  export const v3_1 = (swagger: ISwaggerV31): ISwagger => {
    const converter = new V3_1Converter(swagger);
    return typia.assert<ISwagger>(converter.convert() as ISwagger);
  };
}
