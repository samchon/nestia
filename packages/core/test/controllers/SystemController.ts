import core from "@nestia/core";
import * as nest from "@nestjs/common";
import fs from "fs";
import git from "git-last-commit";
import { randint } from "tstl/algorithm/random";
import { Singleton } from "tstl/thread/Singleton";

import { ISystem } from "../api/structures/ISystem";

@nest.Controller("system")
export class SystemController {
    @core.EncryptedRoute.Get()
    public async get(): Promise<ISystem> {
        return {
            uid: uid_,
            arguments: process.argv,
            created_at: created_at_.toString(),
            package: await package_.get(),
            commit: await commit_.get(),
        };
    }
}

const uid_: number = randint(0, Number.MAX_SAFE_INTEGER);
const created_at_: Date = new Date();

const commit_: Singleton<Promise<ISystem.ICommit>> = new Singleton(
    () =>
        new Promise((resolve, reject) => {
            git.getLastCommit((err, commit) => {
                if (err) reject(err);
                else
                    resolve({
                        ...commit,
                        authored_at: new Date(
                            Number(commit.authoredOn) * 1000,
                        ).toString(),
                        commited_at: new Date(
                            Number(commit.committedOn) * 1000,
                        ).toString(),
                    });
            });
        }),
);
const package_: Singleton<Promise<ISystem.IPackage>> = new Singleton(
    async () => {
        const content: string = await fs.promises.readFile(
            `${__dirname}/../../../package.json`,
            "utf8",
        );
        return JSON.parse(content);
    },
);
commit_.get().catch(() => {});
package_.get().catch(() => {});
