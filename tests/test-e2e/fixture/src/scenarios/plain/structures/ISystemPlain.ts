/**
 * System Information.
 *
 * @author Jeongho Nam
 */
export interface ISystemPlain {
  /** Random Unique ID. */
  uid: number;

  /** `process.argv` */
  arguments: string[];

  /** Git commit info. */
  commit: ISystemPlain.ICommitPlain;

  /** `package.json` */
  package: ISystemPlain.IPackagePlain;

  /** Creation time of this server. */
  created_at: string;
}

export namespace ISystemPlain {
  /** Git commit info. */
  export interface ICommitPlain {
    shortHash: string;
    branch: string;
    hash: string;
    subject: string;
    sanitizedSubject: string;
    body: string;
    author: ICommitPlain.IUserPlain;
    committer: ICommitPlain.IUserPlain;
    authored_at: string;
    committed_at: string;
    notes?: string;
    tags: string[];
  }
  export namespace ICommitPlain {
    /** Git user account info. */
    export interface IUserPlain {
      name: string;
      email: string;
    }
  }

  /** NPM package info. */
  export interface IPackagePlain {
    name: string;
    version: string;
    description: string;
    main?: string;
    typings?: string;
    scripts: Record<string, string>;
    repository: { type: "git"; url: string };
    author: string;
    license: string;
    bugs: { url: string };
    homepage: string;
    devDependencies?: Record<string, string>;
    dependencies: Record<string, string>;
    publishConfig?: { registry: string };
    files?: string[];
  }
}
