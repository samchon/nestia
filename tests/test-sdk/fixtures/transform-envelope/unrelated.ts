/**
 * A module of the same program that imports no declaration of its own.
 *
 * It is the negative twin's subject: its edge list must stay free of the DTO
 * `controller.ts` consults, because a graph that widened every file's edge set
 * would restore the whole-project invalidation the section exists to replace.
 */
export const unrelated = (value: string): string => value.trim();
