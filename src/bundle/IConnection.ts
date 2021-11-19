/**
 * @packageDocumentation
 * @module api
 */
//================================================================
export interface IConnection
{
    host: string;
    headers?: Record<string, string>;
    encryption?: IConnection.IEncyptionPassword | IConnection.EncryptionClosure;
    enforcePath?: string;
}

export namespace IConnection
{
    export interface IEncyptionPassword
    {
        key: string;
        iv: string;
    }

    export interface EncryptionClosure
    {
        (content: string, isEncode: boolean): IEncyptionPassword;
    } 
}