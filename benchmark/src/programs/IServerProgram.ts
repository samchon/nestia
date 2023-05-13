export interface IServerProgram<T> {
    open(input: T): Promise<number>;
    close(): Promise<void>;
}
