import { Fetcher } from "../bundle/__internal/Fetcher";
import { IRoute } from "../structures/IRoute";

export namespace FunctionGenerator
{
    export function generate(route: IRoute): string
    {
        const input: IRoute.IParameter | undefined = route.parameters.find(param => param.category === "body");
        return [head, body, tail]
            .map(closure => closure(route, input))
            .join("\n");
    }

    /* ---------------------------------------------------------
        BODY
    --------------------------------------------------------- */
    function body(route: IRoute, input: IRoute.IParameter | undefined): string
    {
        // PREPARE PARAMETERS FOR THE FETCHER
        const path: string = get_path(route);
        const config: Fetcher.IConfig = {
            input_encrypted: input !== undefined && input.encrypted,
            output_encrypted: route.encrypted
        };
        const parameters: string[] = 
        [
            "connection",
            JSON.stringify(config),
            `"${route.method}"`,
            path
        ];
        if (input !== undefined)
            parameters.push("input");

        return ""
            + "    return Fetcher.fetch\n"
            + "    (\n"
            + parameters.map(param => `        ${param}`).join(",\n") + "\n"
            + "    );";
    }

    function get_path(route: IRoute): string
    {
        const parameters = route.parameters.filter(param => param.category === "param");
        let path: string = route.path;

        for (const param of parameters)
            path = path.replace(`:${param.field}`, `"\${${param.name}}"`);
        return `\`${path}\``;
    }

    /* ---------------------------------------------------------
        HEAD & TAIL
    --------------------------------------------------------- */
    function head(route: IRoute, input: IRoute.IParameter | undefined): string
    {
        const parameters: string = route.parameters.map(param => 
        {
            const type: string = param === input
                ? `Primitive<${route.name}.Input>`
                : param.type
            return `${param.name}: ${type}`
        }).join(", ");

        return `// ${route.method} ${route.path}\n`
            + `export function ${route.name}(connection: IConnection, ${parameters}): Promise<${route.name}.Output>\n`
            + "{";
    }

    function tail(route: IRoute, input: IRoute.IParameter | undefined): string
    {
        const request: string = (input !== undefined)
            ? `    export type Input = Primitive<${input!.type}>;\n`
            : "";
            
        return `}\n`
            + `export namespace ${route.name}\n`
            + "{\n"
            + `${request}`
            + `    export type Output = Primitive<${route.output}>;\n`
            + "}";
    }
}