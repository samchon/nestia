import { IConnection } from "../typings/IConnection";
import { Primitive } from "../typings/Primitive";

export namespace Fetcher
{
    export async function fetch<Output>(connection: IConnection, method: "GET" | "DELETE", path: string): Promise<Primitive<Output>>;
    export async function fetch<Input, Output>(connection: IConnection, method: "POST" | "PUT" | "PATCH", path: string, input: Input): Promise<Primitive<Output>>;

    export async function fetch<Output>(connection: IConnection, method: string, path: string, input?: object): Promise<Primitive<Output>>
    {
        
    }
}