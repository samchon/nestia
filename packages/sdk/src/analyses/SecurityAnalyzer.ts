import { MapUtil } from "../utils/MapUtil";

export namespace SecurityAnalyzer {
    export const merge = (...entire: Record<string, string[]>[]) => {
        const dict: Map<string, Set<string>> = new Map();
        for (const obj of entire)
            for (const [key, value] of Object.entries(obj)) {
                const set = MapUtil.take(dict, key, () => new Set());
                for (const val of value) set.add(val);
            }
        const output: Record<string, string[]>[] = [];
        for (const [key, set] of dict) {
            const obj = {
                [key]: [...set],
            };
            output.push(obj);
        }
        return output;
    };
}
