import { IEncyptionPassword } from "./IEncryptionPassword";

export interface IConnection
{
    host: string;
    headers?: Record<string, string>;
    encryption?: IEncyptionPassword;
}