import { MapUtil } from "../utils/MapUtil";

export namespace SecurityAnalyzer {
  const none = Symbol("none");
  export const merge = (...entire: Record<string, string[]>[]) => {
    const dict: Map<string | typeof none, Set<string>> = new Map();
    for (const obj of entire) {
      const entries = Object.entries(obj);
      for (const [key, value] of entries) {
        const set = MapUtil.take(dict, key, () => new Set());
        for (const val of value) set.add(val);
      }
      if (entries.length === 0) MapUtil.take(dict, none, () => new Set());
    }
    const output: Record<string, string[]>[] = [];
    for (const [key, set] of dict)
      key === none
        ? output.push({})
        : output.push({
            [key]: [...set],
          });
    return output;
  };
}
