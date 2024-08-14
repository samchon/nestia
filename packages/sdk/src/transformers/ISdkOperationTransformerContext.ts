import ts from "typescript";
import { MetadataCollection } from "typia/lib/factories/MetadataCollection";

export interface ISdkOperationTransformerContext {
  checker: ts.TypeChecker;
  api: ts.TransformationContext;
  collection: MetadataCollection;
}
