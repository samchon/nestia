/**
 * HTTP Error from the backend server.
 * 
 * @author Jeongho Nam - https://github.com/samchon
 */
export class HttpError extends Error
{
    public readonly method: string;
    public readonly path: string;
    public readonly status: number;

    public constructor(method: string, path: string, status: number, message: string)
    {
        super(message);

        // INHERITANCE POLYFILL
        const proto: HttpError = new.target.prototype;
        if (Object.setPrototypeOf)
            Object.setPrototypeOf(this, proto);
        else
            (this as any).__proto__ = proto;

        // ASSIGN MEMBERS
        this.method = method;
        this.path = path;
        this.status = status;
    }
}