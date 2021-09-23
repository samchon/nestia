// https://github.com/sindresorhus/strip-json-comments

const singleComment: any = Symbol('singleComment');
const multiComment: any = Symbol('multiComment');

const stripWithoutWhitespace = () => '';
const stripWithWhitespace = (string: string, start: number, end: number) => string.slice(start, end).replace(/\S/g, ' ');

const isEscaped = (jsonString: string, quotePosition: number) => {
    let index = quotePosition - 1;
    let backslashCount = 0;

    while (jsonString[index] === '\\') {
        index -= 1;
        backslashCount += 1;
    }

    return Boolean(backslashCount % 2);
};

export function stripJsonComments(jsonString: string, {whitespace = true} = {}) {
    if (typeof jsonString !== 'string') {
        throw new TypeError(`Expected argument \`jsonString\` to be a \`string\`, got \`${typeof jsonString}\``);
    }

    const strip = whitespace ? stripWithWhitespace : stripWithoutWhitespace;

    let isInsideString = false;
    let isInsideComment = false;
    let offset = 0;
    let result = '';

    for (let index = 0; index < jsonString.length; index++) {
        const currentCharacter = jsonString[index];
        const nextCharacter = jsonString[index + 1];

        if (!isInsideComment && currentCharacter === '"') {
            const escaped = isEscaped(jsonString, index);
            if (!escaped) {
                isInsideString = !isInsideString;
            }
        }

        if (isInsideString) {
            continue;
        }

        if (!isInsideComment && currentCharacter + nextCharacter === '//') {
            result += jsonString.slice(offset, index);
            offset = index;
            isInsideComment = singleComment;
            index++;
        } else if (isInsideComment === singleComment && currentCharacter + nextCharacter === '\r\n') {
            index++;
            isInsideComment = false;
            result += strip(jsonString, offset, index);
            offset = index;
            continue;
        } else if (isInsideComment === singleComment && currentCharacter === '\n') {
            isInsideComment = false;
            result += strip(jsonString, offset, index);
            offset = index;
        } else if (!isInsideComment && currentCharacter + nextCharacter === '/*') {
            result += jsonString.slice(offset, index);
            offset = index;
            isInsideComment = multiComment;
            index++;
            continue;
        } else if (isInsideComment === multiComment && currentCharacter + nextCharacter === '*/') {
            index++;
            isInsideComment = false;
            result += strip(jsonString, offset, index + 1);
            offset = index + 1;
            continue;
        }
    }

    return result + (isInsideComment ? (strip as any)(jsonString.slice(offset)) : jsonString.slice(offset));
}