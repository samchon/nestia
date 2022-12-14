/**
 * @packageDocumentation
 * @module api.structures.monitors
 */
//================================================================
/**
 * System Information.
 *
 * @author Jeongho Nam
 */
export interface ISystem {
    /**
     * Random Unique ID.
     */
    uid: number;

    /**
     * `process.argv`
     */
    arguments: string[];

    /**
     * Git commit information.
     */
    commit: ISystem.ICommit;

    /**
     * `package.json`     */
    package: ISystem.IPackage;

    /**
     * Creation time of this system.
     */
    created_at: string;
}

export namespace ISystem {
    /**
     * Git commit information.
     */
    export interface ICommit {
        shortHash: string;
        branch: string;
        hash: string;
        subject: string;
        sanitizedSubject: string;
        body: string;
        author: ICommit.IUser;
        committer: ICommit.IUser;
        authored_at: string;
        commited_at: string;
        notes?: string;
        tags: string[];
    }
    export namespace ICommit {
        /**
         * Git user information.
         */
        export interface IUser {
            name: string;
            email: string;
        }
    }

    /**
     * NPM package information.
     */
    export interface IPackage {
        name: string;
        version: string;
        description: string;
        scripts: Record<string, string>;
        repository: { type: "git"; url: string };
        author: string;
        license: string;
        bugs: { url: string };
        homepage: string;
        devDependencies: Record<string, string>;
        dependencies: Record<string, string>;
        publishConfig?: { registry: string };
        main?: string;
        typings?: string;
        files?: string[];
    }
}
