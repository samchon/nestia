import type * as tsc from "typescript";
import { Pair } from "tstl/utility/Pair";
import { Vector } from "tstl/container/Vector";

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
            path = path.replace(`:${param.field}`, `\${${param.name}}`);

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
        //----
        // CONSTRUCT COMMENT
        //----
        // MAIN DESCRIPTION
        let comment: string = route.comments.map(comment => comment.text).join("\n\n");
        if (comment !== "")
            comment += "\n\n";

        // FILTER TAGS (VULNERABLE PARAMETERS WOULD BE REMOVED)
        const tags: tsc.JSDocTagInfo[] = route.tags.filter(tag => 
        {
            if (tag.name === "param")
            {
                if (tag.text === undefined)
                    return false;
                
                const variable: string = tag.text.split(" ")[0];
                return route.parameters.find(param => variable === param.name) !== undefined;
            }
            return true;
        });
        if (tags.length !== 0)
        {
            const index: number = tags.findIndex(t => t.name === "param");
            if (index !== -1)
            {
                const capsule: Vector<tsc.JSDocTagInfo> = Vector.wrap(tags);
                capsule.insert(capsule.nth(index), {
                    name: "param",
                    text: "connection Information of the remote HTTP(s) server with headers (+encryption password)"
                });
            }
            comment += tags.map(t => `@${t.name} ${t.text ? t.text : ""}`).join("\n") + "\n\n";
        }
        
        // COMPLETE THE COMMENT
        comment += `@controller ${route.symbol}\n`;
        comment += `@path ${route.method} ${route.path}`;

        //----
        // FINALIZATION
        //----
        // REFORM PARAMETERS TEXT
        const parameters: string = route.parameters.map(param => 
            {
                const type: string = (param === query || param === input)
                    ? `Primitive<${route.name}.${param === query ? "Query" : "Input"}>`
                    : param.type
                return `${param.name}: ${type}`;
            }).join(", ");

        // OUTPUT TYPE
        const output: string = route.output === "void"
            ? "void"
            : `${route.name}.Output`;

        // RETURNS WITH CONSTRUCTION
        return ""
            + "/**\n"
            + comment.split("\r\n").join("\n").split("\n").map(str => ` * ${str}`).join("\n") + "\n"
            + " */\n"
            + `export function ${route.name}(connection: IConnection, ${parameters}): Promise<${output}>\n`
            + "{";
    }

    function tail(route: IRoute, query: IRoute.IParameter | undefined, input: IRoute.IParameter | undefined): string
    {
        const types: Pair<string, string>[] = [];
        if (query !== undefined)
            types.push(new Pair("Query", query.type));
        if (input !== undefined)
            types.push(new Pair("Input", input.type));
        if (route.output !== "void")
            types.push(new Pair("Output", route.output));
        
        if (types.length === 0)
            return "}";
        
        return `}\n`
            + `export namespace ${route.name}\n`
            + "{\n"
            + (types.map(tuple => `    export type ${tuple.first} = Primitive<${tuple.second}>;`).join("\n")) + "\n"
            + "}";
    }
}