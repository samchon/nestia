import { ISwagger } from "../structures/ISwagger";
import { RouteDirectory } from "../structures/RouteDirectory";
import { MapUtil } from "../utils/MapUtil";

export namespace DirectoryProgrammer {
    export const write = (swagger: ISwagger): RouteDirectory => {
        const root: RouteDirectory = new RouteDirectory(null, "functional");
        for (const [path, collection] of Object.entries(swagger.paths)) {
            const directory: RouteDirectory = emplace(root)(path);
            for (const [method, value] of Object.entries(collection))
                directory.routes.push({
                    method,
                    path,
                    value,
                });
        }
        return root;
    };

    const emplace = (directory: RouteDirectory) => (path: string) => {
        const identifiers = path
            .split("/")
            .map((str) => str.trim())
            .filter((str) => !!str.length && str[0] !== ":")
            .map((str) => str.split("-").join("_").split(".").join("_"));
        for (const key of identifiers)
            directory = MapUtil.take(directory.children)(key)(
                () => new RouteDirectory(directory, key),
            );
        return directory;
    };
}
