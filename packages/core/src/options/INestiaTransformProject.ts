import { IProject } from "typia/lib/transformers/IProject";

import { INestiaTransformOptions } from "./INestiaTransformOptions";

export interface INestiaTransformProject extends Omit<IProject, "options"> {
    options: INestiaTransformOptions;
}
