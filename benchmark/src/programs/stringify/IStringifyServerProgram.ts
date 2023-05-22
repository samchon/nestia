import { Collection } from "../../structures/pure/Collection";

export interface IStringifyServerProgram<T> {
    open(input: Collection<T>): Promise<number>;
    close(): Promise<void>;
}
