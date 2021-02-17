import { AesPkcs5 } from "./../../../../../__internal/AesPkcs5";
import { Fetcher } from "./../../../../../__internal/Fetcher";
import type { IConnection } from "./../../../../../IConnection";
import type { Primitive } from "./../../../../../Primitive";

import type { ISeller } from "./../../../../../structures/actors/ISeller";


// PATCH markets/sellers/authenticate/password/change
// SellerAuthenticateController.change()
export function change(connection: IConnection, input: Primitive<change.Input>): Promise<change.Output>
{
    return Fetcher.fetch
    (
        connection,
        {"input_encrypted":true,"output_encrypted":true},
        "PATCH",
        `markets/sellers/authenticate/password/change`,
        input
    );
}
export namespace change
{
    export type Input = Primitive<ISeller.IChangePassword>;
    export type Output = Primitive<object>;
}



//---------------------------------------------------------
// TO PREVENT THE UNUSED VARIABLE ERROR
//---------------------------------------------------------
AesPkcs5;
Fetcher;
