export namespace ArrayUtil {
  export function has<T>(array: T[], ...items: T[]): boolean {
    return items.every(
      (elem) => array.find((org) => org === elem) !== undefined,
    );
  }
}
