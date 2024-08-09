import { VERSION_NEUTRAL } from "@nestjs/common/interfaces";

import { IReflectHttpOperationException } from "./IReflectHttpOperationException";
import { IReflectHttpOperationParameter } from "./IReflectHttpOperationParameter";
import { IReflectHttpOperationSuccess } from "./IReflectHttpOperationSuccess";
import { IReflectTypeImport } from "./IReflectTypeImport";

export interface IReflectHttpOperation {
  protocol: "http";
  function: Function;
  name: string;
  method: string;
  paths: string[];
  versions: Array<string | typeof VERSION_NEUTRAL> | undefined;
  parameters: IReflectHttpOperationParameter[];
  success: IReflectHttpOperationSuccess;
  exceptions: Record<
    number | "2XX" | "3XX" | "4XX" | "5XX",
    IReflectHttpOperationException
  >;
  security: Record<string, string[]>[];
  tags: string[];
  imports: IReflectTypeImport[];
}
