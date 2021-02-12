import { Pair } from "tstl/utility/Pair";
import { Fetcher } from "../bundle/__internal/Fetcher";
import { IRoute } from "../structures/IRoute";

export namespace FunctionGenerator
{
    export function generate(route: IRoute): string
    {
        const query: IRoute.IParameter | undefined = route.parameters.find(param => param.category === "query");
        const input: IRoute.IParameter | undefined = route.parameters.find(param => param.category === "body");

        return [head, body, tail]
            .map(closure => closure(route, query, input))
            .join("\n");
    }

    /* ---------------------------------------------------------
        BODY
    --------------------------------------------------------- */
    function body(route: IRoute, query: IRoute.IParameter | undefined, input: IRoute.IParameter | undefined): string
    {
        // PATH WITH ENCRYPTION
        const path: string = get_path(route, query);
        const config: Fetcher.IConfig = {
            input_encrypted: input !== undefined && input.encrypted,
            output_encrypted: route.encrypted
        };

        // FETCH ARGUMENTS WITH REQUST BODY
        const fetchArguments: string[] = 
        [
            "connection",
            JSON.stringify(config),
            `"${route.method}"`,
            path
        ];
        if (input !== undefined)
            fetchArguments.push("input");

        // RETURNS WITH FINALIZATION
        return ""
            + "    return Fetcher.fetch\n"
            + "    (\n"
            + fetchArguments.map(param => `        ${param}`).join(",\n") + "\n"
            + "    );";
    }

    function get_path(route: IRoute, query: IRoute.IParameter | undefined): string
    {
        const parameters = route.parameters.filter(param => param.category === "param");
        let path: string = route.path;

        for (const param of parameters)
            path = path.replace(`:${param.field}`, `"\${${param.name}}"`);

        new URLSearchParams()
        return (query !== undefined)
            ? `\`${path}?\${new URLSearchParams(${query.name} as any).toString()}\``
            : `\`${path}\``
    }

    /* ---------------------------------------------------------
        HEAD & TAIL
    --------------------------------------------------------- */
    function head(route: IRoute, query: IRoute.IParameter | undefined, input: IRoute.IParameter | undefined): string
    {
        const parameters: string = route.parameters.map(param => 
        {
            const type: string = (param === query || param === input)
                ? `Primitive<${route.name}.${param === query ? "Query" : "Input"}>`
                : param.type
            return `${param.name}: ${type}`;
        }).join(", ");

        return `// ${route.method} ${route.path}\n`
            + `// ${route.controller}\n`
            + `export function ${route.name}(connection: IConnection, ${parameters}): Promise<${route.name}.Output>\n`
            + "{";
    }

    function tail(route: IRoute, query: IRoute.IParameter | undefined, input: IRoute.IParameter | undefined): string
    {
        const types: Pair<string, string>[] = [];
        if (query !== undefined)
            types.push(new Pair("Query", query.type));
        if (input !== undefined)
            types.push(new Pair("Input", input.type));
            
        return `}\n`
            + `export namespace ${route.name}\n`
            + "{\n"
            + (types.map(tuple => `    export type ${tuple.first} = Primitive<${tuple.second}>;`).join("\n"))
            + (types.length !== 0 ? "\n" : "")
            + `    export type Output = Primitive<${route.output}>;\n`
            + "}";
    }
}