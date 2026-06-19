export namespace ArrayUtil {
  export function has<T>(array: T[], ...items: T[]): boolean {
    return items.every(
      (elem) => array.find((org) => org === elem) !== undefined,
    );
  }

  export async function asyncMap<X, Y>(
    array: X[],
    closure: (input: X) => Promise<Y>,
  ): Promise<Y[]> {
    const ret: Y[] = [];
    for (const elem of array) ret.push(await closure(elem));
    return ret;
  }

  export async function asyncFilter<T>(
    array: T[],
    closure: (input: T) => Promise<boolean>,
  ): Promise<T[]> {
    const ret: T[] = [];
    for (const elem of array)
      if ((await closure(elem)) === true) ret.push(elem);
    return ret;
  }
}
