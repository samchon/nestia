export namespace PathUtil {
    export const accessors = (path: string) =>
        path
            .split("/")
            .filter((str) => str.length && str[0] !== ":")
            .map(normalize);

    const normalize = (str: string) =>
        str.split("-").join("_").split(".").join("_");
}
