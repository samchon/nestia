import { IJsDocTagInfo, Primitive } from "typia";
import { MetadataFactory } from "typia/lib/factories/MetadataFactory";
import { IMetadata } from "typia/lib/schemas/metadata/IMetadata";
import { IMetadataComponents } from "typia/lib/schemas/metadata/IMetadataComponents";

import { IReflectType } from "./IReflectType";
import { IReflectTypeImport } from "./IReflectTypeImport";

export interface IOperationMetadata {
  parameters: IOperationMetadata.IParameter[];
  success: IOperationMetadata.IResponse;
  exceptions: Record<string, IOperationMetadata.IResponse>;
  description: string | null;
  jsDocTags: IJsDocTagInfo[];
}
export namespace IOperationMetadata {
  export interface IParameter extends IResponse {
    name: string;
    index: number;
  }
  export interface IResponse {
    imports: IReflectTypeImport[];
    components: IMetadataComponents;
    primitive: ISchema | null;
    resolved: ISchema | null;
    type: IReflectType | null;
    required: boolean;
    errors: Primitive<MetadataFactory.IError>[];
  }
  export interface ISchema {
    components: IMetadataComponents;
    value: IMetadata;
  }
}
