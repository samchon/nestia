import { IMetadataDictionary } from "@nestia/typia-core-legacy";

import { INestiaProject } from "./INestiaProject";
import { ITypedHttpRoute } from "./ITypedHttpRoute";
import { ITypedWebSocketRoute } from "./ITypedWebSocketRoute";

export interface ITypedApplication {
  project: INestiaProject;
  collection: IMetadataDictionary;
  routes: Array<ITypedHttpRoute | ITypedWebSocketRoute>;
}
