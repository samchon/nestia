/**
 * System Information.
 *
 * @author Jeongho Nam
 */
export interface ISystemMultipartFormData {
  /** Random Unique ID. */
  uid: number;

  /** `process.argv` */
  arguments: string[];

  /** Git commit info. */
  commit: ISystemMultipartFormData.ICommitMultipartFormData;

  /** `package.json` */
  package: ISystemMultipartFormData.IPackageMultipartFormData;

  /** Creation time of this server. */
  created_at: string;
}

export namespace ISystemMultipartFormData {
  /** Git commit info. */
  export interface ICommitMultipartFormData {
    shortHash: string;
    branch: string;
    hash: string;
    subject: string;
    sanitizedSubject: string;
    body: string;
    author: ICommitMultipartFormData.IUserMultipartFormData;
    committer: ICommitMultipartFormData.IUserMultipartFormData;
    authored_at: string;
    committed_at: string;
    notes?: string;
    tags: string[];
  }
  export namespace ICommitMultipartFormData {
    /** Git user account info. */
    export interface IUserMultipartFormData {
      name: string;
      email: string;
    }
  }

  /** NPM package info. */
  export interface IPackageMultipartFormData {
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
