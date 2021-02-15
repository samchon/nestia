import { AesPkcs5 } from "./../../__internal/AesPkcs5";
import { Fetcher } from "./../../__internal/Fetcher";
import type { IConnection } from "./../../IConnection";
import type { Primitive } from "./../../Primitive";

import type { IPerformance } from "./../../structures/performance/IMemoryUsage";


// GET performance/
// PerformanceController.get()
export function get(connection: IConnection, ): Promise<get.Output>
{
    return Fetcher.fetch
    (
        connection,
        {"input_encrypted":false,"output_encrypted":true},
        "GET",
        `performance/`
    );
}
export namespace get
{
    export type Output = Primitive<IPerformance>;
}



//---------------------------------------------------------
// TO PREVENT THE UNUSED VARIABLE ERROR
//---------------------------------------------------------
AesPkcs5;
Fetcher;
