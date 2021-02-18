import { AesPkcs5 } from "./../../../../__internal/AesPkcs5";
import { Fetcher } from "./../../../../__internal/Fetcher";
import type { IConnection } from "./../../../../IConnection";
import type { Primitive } from "./../../../../Primitive";

import type { ISeller } from "./../../../../structures/actors/ISeller";

export * as password from "./password";

/**
 * Join as a seller.
 * 
 * @param connection Information of the remote HTTP(s) server with headers (+encryption password)
 * @param input Information of yours
 * @return Information of newly joined seller
 * 
 * @controller SellerAuthenticateController.join()
 * @path POST markets/sellers/authenticate/join
 */
export function join(connection: IConnection, input: Primitive<join.Input>): Promise<join.Output>
{
    return Fetcher.fetch
    (
        connection,
        {"input_encrypted":true,"output_encrypted":true},
        "POST",
        `markets/sellers/authenticate/join`,
        input
    );
}
export namespace join
{
    export type Input = Primitive<ISeller.IJoin>;
    export type Output = Primitive<ISeller>;
}

/**
 * Log-in as a seller.
 * 
 * @param connection Information of the remote HTTP(s) server with headers (+encryption password)
 * @param input Email and password
 * @return Information of the seller
 * 
 * @controller SellerAuthenticateController.login()
 * @path POST markets/sellers/authenticate/login
 */
export function login(connection: IConnection, input: Primitive<login.Input>): Promise<login.Output>
{
    return Fetcher.fetch
    (
        connection,
        {"input_encrypted":true,"output_encrypted":true},
        "POST",
        `markets/sellers/authenticate/login`,
        input
    );
}
export namespace login
{
    export type Input = Primitive<ISeller.ILogin>;
    export type Output = Primitive<ISeller>;
}



//---------------------------------------------------------
// TO PREVENT THE UNUSED VARIABLE ERROR
//---------------------------------------------------------
AesPkcs5;
Fetcher;
