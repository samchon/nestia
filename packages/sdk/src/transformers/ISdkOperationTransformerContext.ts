import { MetadataCollection } from "@typia/core";
import ts from "typescript";

export interface ISdkOperationTransformerContext {
  checker: ts.TypeChecker;
  transformer: ts.TransformationContext;
  collection: MetadataCollection;
}
