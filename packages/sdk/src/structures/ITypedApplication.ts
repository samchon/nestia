import { IMetadataDictionary } from "../internal/legacy";

import { INestiaProject } from "./INestiaProject";
import { ITypedHttpRoute } from "./ITypedHttpRoute";
import { ITypedMcpRoute } from "./ITypedMcpRoute";
import { ITypedWebSocketRoute } from "./ITypedWebSocketRoute";

export interface ITypedApplication {
  project: INestiaProject;
  collection: IMetadataDictionary;
  routes: Array<ITypedHttpRoute | ITypedWebSocketRoute | ITypedMcpRoute>;
}
