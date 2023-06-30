import { IProgramMethod } from "./IProgramMethod";

export interface IProgramController {
    name: string;
    namespace: string;
    path: string;
    methods: IProgramMethod[];
}