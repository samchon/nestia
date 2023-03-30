function array_equal_to(
    items: string[],
    name: string,
    x: any[],
    y: any[],
): void {
    if (x.length !== y.length) items.push(`${name}.length`);
    x.forEach((xItem, i) => any_equal_to(items, `${name}[${i}]`, xItem, y[i]));
}

function object_equal_to(
    items: string[],
    name: string,
    x: any,
    y: any,
): boolean {
    for (const key in x) {
        if (key.substr(-2) === "id" || key.substr(-3) === "_at") continue;
        any_equal_to(items, `${name}.${key}`, x[key], y[key]);
    }
    return true;
}

function any_equal_to(items: string[], name: string, x: any, y: any): void {
    if (typeof x !== typeof y) items.push(name);
    else if (x instanceof Array)
        if (!(y instanceof Array)) items.push(name);
        else array_equal_to(items, name, x, y);
    else if (x instanceof Object) object_equal_to(items, name, x, y);
    else if (x !== y) items.push(name);
}

export function json_equal_to<T>(x: T, y: T): string[] {
    const ret: string[] = [];
    any_equal_to(ret, "", x, y);
    return ret;
}
