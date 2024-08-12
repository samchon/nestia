import { INestiaProject } from "./INestiaProject";
import { ITypedHttpRoute } from "./ITypedHttpRoute";
import { ITypedWebSocketRoute } from "./ITypedWebSocketRoute";

export interface ITypedApplication {
  project: INestiaProject;
  routes: Array<ITypedHttpRoute | ITypedWebSocketRoute>;
}
