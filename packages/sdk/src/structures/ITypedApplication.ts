import { IMetadataDictionary } from "typia/lib/schemas/metadata/IMetadataDictionary";

import { INestiaProject } from "./INestiaProject";
import { ITypedHttpRoute } from "./ITypedHttpRoute";
import { ITypedWebSocketRoute } from "./ITypedWebSocketRoute";

export interface ITypedApplication {
  project: INestiaProject;
  collection: IMetadataDictionary;
  routes: Array<ITypedHttpRoute | ITypedWebSocketRoute>;
}
