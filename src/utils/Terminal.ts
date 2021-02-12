import * as cp from "child_process";
import { Pair } from "tstl/utility/Pair";

export namespace Terminal
{
    export function execute(...commands: string[]): Promise<Pair<string, string>>
    {
        return new Promise((resolve, reject) =>
        {
            cp.exec(commands.join(" && "), (error: Error | null, stdout: string, stderr: string) =>
            {
                if (error)
                    reject(error);
                else
                    resolve(new Pair(stdout, stderr));
            });
        });
    }
}