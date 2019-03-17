/*

    *** Trusted Code ***


    -- unsafe functions with honest types --



    Code disabling ERTS checks
    - should all be in this one file
    - should have very very honest types


    Explanation:
        Unsafe data (from APIs etc) must be moved into the ERTS world savely.
        ERTS checks usually prevent code from working with unsafe data.

        Never change this file lightly. 
        Ignoring ERTS rules can cause Runtime Exceptions!
        Never use the techniques here, to disable ERTS checks, in any other file.

*/
import { PathReporter } from "io-ts/lib/PathReporter"
import * as t from "io-ts"

/*

-- EXHAUSTIVE PROGRAMMING

*/

export function ifReachable(x: never): Error {
    return new Error("Unreachable default-clause in switch-statement reached")
}

/*

-- ERRORS

*/

export class ERTSError {
    /**
     * Use this instead of the normal Error class
     * (for return types)
     *
     * - The normal Error class has Bugs with instanceof => type safety problem
     * - The normal Error class will create stack traces => not a good return type
     */
    constructor(public message: string) {}
}

/*

-- WORKING WITH ANY FUNCTIONS

*/

export function callFnAnyAsVoid(
    fn: (...args: any[]) => any, // tslint:disable-line
    thisBind: any, // tslint:disable-line
    args: any[], // tslint:disable-line
): void {
    fn.apply(thisBind, args) // tslint:disable-line
}

/*

-- JSON, SAFE DATA

*/

export class DecodeJsonError extends ERTSError {
    constructor(public decodeErrorMessages: string[], public suppliedJson: string) {
        super(
            "Decoding JSON failed. \n\nErrors: " +
                decodeErrorMessages.join(" \n") +
                " \n\nSuppliedJson: " +
                suppliedJson,
        )
    }
}

export function decodeJsonSync<I, A>(
    decoder: t.Decoder<I, A>,
    json: any, // tslint:disable-line
): A | DecodeJsonError {
    // tslint:disable-next-line
    const result = decoder.decode(json)

    if (result.isLeft()) {
        return new DecodeJsonError(PathReporter.report(result), JSON.stringify(json))
    } else {
        return result.value
    }
}

export function decodeJsonStrSync<I, A>(
    decoder: t.Decoder<I, A>,
    jsonStr: string,
): A | DecodeJsonError {
    // tslint:disable-next-line
    const parsed = JSON.parse(jsonStr)
    return decodeJsonSync(decoder, parsed)
}

export function decodeJson<I, A>(
    decoder: t.Decoder<I, A>,
    json: any, // tslint:disable-line
): Promise<A> {
    return new Promise<A>((resolve, reject) => {
        const result = decodeJsonSync(decoder, json)

        if (result instanceof DecodeJsonError) {
            reject(result)
            return
        }

        resolve(result)
    })
}

export function decodeJsonStr<I, A>(decoder: t.Decoder<I, A>, jsonStr: string): Promise<A> {
    // tslint:disable-next-line
    const parsed = JSON.parse(jsonStr)
    return decodeJson(decoder, parsed)
}
