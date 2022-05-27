export namespace StringUtil {
    export function betweens(
        str: string,
        start: string,
        end: string,
    ): string[] {
        const ret: string[] = str.split(start);
        ret.splice(0, 1);

        return ret.map((str) => str.split(end)[0]);
    }
}
