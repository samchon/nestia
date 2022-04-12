import del from "del";
import fs from "fs";

export namespace DirectoryUtil
{
    export async function remove(path: string): Promise<void>
    {
        try 
        { 
            await del(path);
        }
        catch {}
    }

    export async function remake(path: string): Promise<void>
    {
        await remove(path);
        await fs.promises.mkdir(path);
    }

    export async function copy(from: string, to: string): Promise<void>
    {
        await remake(to);
        await _Copy(from, to);
    }

    async function _Copy(from: string, to: string): Promise<void>
    {
        const directory: string[] = await fs.promises.readdir(from);
        for (const file of directory)
        {
            const fromPath: string = `${from}/${file}`;
            const toPath: string = `${to}/${file}`;
            const stats: fs.Stats = await fs.promises.stat(fromPath);

            if (stats.isDirectory() === true)
            {
                await fs.promises.mkdir(toPath);
                await _Copy(fromPath, toPath);
            }
            else
            {
                const content: string = await fs.promises.readFile(fromPath, "utf8");
                await fs.promises.writeFile(toPath, content.split("\r\n").join("\n"), "utf8");
            }
        }
    }
}