/* 

API DOCUMENTATION
https://github.com/gothinkster/realworld/tree/master/api

*/

import * as t from "io-ts"
import { decodeJson, DecodeJsonError, ERTSError } from "./ERTS/ERTS-SafeHelpers"
import { API_ROOT } from "./config"
import { containerCurrentUser } from "./SharedData/containerCurrentUser"

/*

-- AUTHENTICATION TOKEN

*/

let authToken: string | undefined = loadTokenFromLocalStorage()

export const Api = {
    setAuthToken(token: string | undefined): void {
        authToken = token
        window.localStorage.setItem("jwt", token === undefined ? "" : token)
    },

    headers(): { [key: string]: string } {
        let headers: { [key: string]: string } = {
            "Content-Type": "application/json; charset=utf-8",
        }
        if (authToken !== undefined) {
            headers = {
                ...headers,
                Authorization: "Token " + authToken,
            }
        }
        return headers
    },
}

function loadTokenFromLocalStorage(): string | undefined {
    const token = window.localStorage.getItem("jwt")
    if (token !== null && token !== "") return token
    return undefined
}

/*

-- API DECODERS
    
*/

const decoderUser = t.type({
    email: t.string,
    username: t.string,
    image: t.union([t.string, t.null]),
    bio: t.union([t.string, t.null]),
})
const decoderUserWithToken = t.intersection([
    decoderUser,
    t.type({
        token: t.string,
    }),
])
const decoderUserWithPassword = t.intersection([
    decoderUser,
    t.type({
        password: t.string,
    }),
])

const decoderProfile = t.type({
    username: t.string,
    bio: t.union([t.string, t.null]),
    image: t.union([t.string, t.null]),
    following: t.boolean,
})

const decoderArticle = t.type({
    title: t.string,
    description: t.string,
    body: t.string,
    tagList: t.array(t.string),
})

const decoderArticleWithSlug = t.intersection([decoderArticle, t.type({ slug: t.string })])

const decoderArticleWithMeta = t.intersection([
    decoderArticleWithSlug,
    t.type({
        createdAt: t.string,
        updatedAt: t.string,
        favorited: t.boolean,
        favoritesCount: t.number,
        author: decoderProfile,
    }),
])

const decoderMultiArticles = t.type({
    articles: t.array(decoderArticleWithMeta),
    articlesCount: t.number,
})
const decoderSingleArticle = t.type({ article: decoderArticleWithMeta })

const decoderComment = t.type({
    id: t.number,
    createdAt: t.string,
    updatedAt: t.string,
    body: t.string,
    author: decoderProfile,
})

const decoderProfileResponse = t.type({ profile: decoderProfile })
const decoderUserResponse = t.type({ user: decoderUserWithToken })
const decoderTagsResponse = t.type({ tags: t.array(t.string) })
const decoderSingleCommentResponse = t.type({ comment: decoderComment })
const decoderMultiCommentResponse = t.type({ comments: t.array(decoderComment) })

const decoderValidationError = t.type({
    errors: t.dictionary(t.string, t.array(t.string)),
})

const STATUS_CODES = {
    Unauthorized: 401,
    Forbidden: 403,
    NotFound: 404,
    ValidationError: 422,
}

/*

-- API TYPES
    
*/

export type User = t.TypeOf<typeof decoderUser>
export type UserWithToken = t.TypeOf<typeof decoderUserWithToken>
export type UserWithPassword = t.TypeOf<typeof decoderUserWithPassword>
export type Profile = t.TypeOf<typeof decoderProfile>
export type Article = t.TypeOf<typeof decoderArticle>
export type ArticleWithSlug = t.TypeOf<typeof decoderArticleWithSlug>
export type ArticleWithMeta = t.TypeOf<typeof decoderArticleWithMeta>
export type Comment = t.TypeOf<typeof decoderComment>

export type UserResponse = t.TypeOf<typeof decoderUserResponse>
export type SingleArticlesResponse = t.TypeOf<typeof decoderSingleArticle>
export type MultiArticlesResponse = t.TypeOf<typeof decoderMultiArticles>
export type ProfileResponse = t.TypeOf<typeof decoderProfileResponse>
export type SingleCommentResponse = t.TypeOf<typeof decoderSingleCommentResponse>
export type MultiCommentResponse = t.TypeOf<typeof decoderMultiCommentResponse>

export class ValidationError extends ERTSError {
    constructor(public messages: { [key: string]: string[] }) {
        super(
            "Validation Errors: \n" +
                Object.keys(messages)
                    .map((key) => key + " " + messages[key].join(" / "))
                    .join(" \n"),
        )
    }
}
export class NotFoundError extends ERTSError {
    constructor() {
        super("Not Found")
    }
}
export class UnauthorizedError extends ERTSError {
    constructor() {
        super("Not Authorized")
    }
}

/*

-- AUTHENTICATION API
    
*/

export const ApiAuth = {
    isLoggedIn: () => authToken !== undefined,

    logout: () => {
        Api.setAuthToken(undefined)
        containerCurrentUser.setState({ type: "Loaded", currentUser: null })
        return Promise.resolve()
    },

    getUser: () =>
        fetch(API_ROOT + "/user", {
            headers: Api.headers(),
        })
            .then(fetchHandleUnauthorizedError)
            .then(fetchFailIfStatusNot200)
            .then((resp) => resp.json())
            .then((resp) => decodeJson(decoderUserResponse, resp))
            .then((userResp) => userResp.user),

    postLogin: (email: string, password: string) =>
        fetch(API_ROOT + "/users/login", {
            method: "POST",
            headers: Api.headers(),
            body: JSON.stringify({ user: { email, password } }),
        })
            .then(fetchHandleValidationError)
            .then(fetchFailIfStatusNot200)
            .then((resp) => resp.json())
            .then((resp) => decodeJson(decoderUserResponse, resp)),

    postRegister: (username: string, email: string, password: string) =>
        fetch(API_ROOT + "/users", {
            method: "POST",
            headers: Api.headers(),
            body: JSON.stringify({ user: { username, email, password } }),
        })
            .then(fetchHandleValidationError)
            .then(fetchFailIfStatusNot200)
            .then((resp) => resp.json())
            .then((resp) => decodeJson(decoderUserResponse, resp)),

    putSave: (user: User | UserWithPassword) =>
        fetch(API_ROOT + "/user", {
            method: "PUT",
            headers: Api.headers(),
            body: JSON.stringify({ user: user }),
        })
            .then(fetchHandleValidationError)
            .then(fetchFailIfStatusNot200)
            .then((resp) => resp.json())
            .then((resp) => decodeJson(decoderUserResponse, resp)),
}

/*

-- TAGS API
    
*/

export const ApiTags = {
    getAll: () =>
        fetch(API_ROOT + "/tags", {
            headers: Api.headers(),
        })
            .then(fetchFailIfStatusNot200)
            .then((resp) => resp.json())
            .then((resp) => decodeJson(decoderTagsResponse, resp))
            .then((tagsResp) => tagsResp.tags),
}

/*

-- ARTICLES API
    
*/

const limit = (count: number, p: number) => `limit=${count}&offset=${p * count}`
export const ApiArticles = {
    getAll: (page: number) =>
        fetch(API_ROOT + `/articles?${limit(10, page)}`, {
            headers: Api.headers(),
        })
            .then(fetchFailIfStatusNot200)
            .then((resp) => resp.json())
            .then((resp) => decodeJson(decoderMultiArticles, resp)),

    getByAuthor: (author: string, page: number) =>
        fetch(API_ROOT + "/articles?author=" + encodeURIComponent(author) + `&${limit(5, page)}`, {
            headers: Api.headers(),
        })
            .then(fetchFailIfStatusNot200)
            .then((resp) => resp.json())
            .then((resp) => decodeJson(decoderMultiArticles, resp)),

    getByTag: (tag: string, page: number) =>
        fetch(API_ROOT + `/articles?tag=${encodeURIComponent(tag)}&${limit(10, page)}`, {
            headers: Api.headers(),
        })
            .then(fetchFailIfStatusNot200)
            .then((resp) => resp.json())
            .then((resp) => decodeJson(decoderMultiArticles, resp)),

    getFeed: (page: number) =>
        fetch(API_ROOT + `/articles/feed?${limit(10, page)}`, {
            headers: Api.headers(),
        })
            .then(fetchFailIfStatusNot200)
            .then((resp) => resp.json())
            .then((resp) => decodeJson(decoderMultiArticles, resp)),

    delete: (slug: string) =>
        fetch(API_ROOT + `/articles/${slug}`, {
            method: "DELETE",
            headers: Api.headers(),
        }).then(fetchFailIfStatusNot200),

    postFavorite: (slug: string) =>
        fetch(API_ROOT + `/articles/${slug}/favorite`, {
            method: "POST",
            headers: Api.headers(),
        })
            .then(fetchHandleValidationError)
            .then(fetchFailIfStatusNot200)
            .then((resp) => resp.json())
            .then((resp) => decodeJson(decoderSingleArticle, resp)),

    deleteFavorite: (slug: string) =>
        fetch(API_ROOT + `/articles/${slug}/favorite`, {
            method: "DELETE",
            headers: Api.headers(),
        })
            .then(fetchFailIfStatusNot200)
            .then((resp) => resp.json())
            .then((resp) => decodeJson(decoderSingleArticle, resp)),

    getFavoritedBy: (author: string, page: number) =>
        fetch(API_ROOT + `/articles?favorited=${encodeURIComponent(author)}&${limit(5, page)}`, {
            headers: Api.headers(),
        })
            .then(fetchFailIfStatusNot200)
            .then((resp) => resp.json())
            .then((resp) => decodeJson(decoderMultiArticles, resp)),

    get: (slug: string) =>
        fetch(API_ROOT + `/articles/${slug}`)
            .then(fetchHandleNotFoundError)
            .then(fetchFailIfStatusNot200)
            .then((resp) => resp.json())
            .then((resp) => decodeJson(decoderSingleArticle, resp)),

    putUpdate: (article: ArticleWithSlug) =>
        fetch(API_ROOT + `/articles/${article.slug}`, {
            method: "PUT",
            headers: Api.headers(),
            body: JSON.stringify({ article: { ...article, slug: undefined } }),
        })
            .then(fetchHandleValidationError)
            .then(fetchFailIfStatusNot200)
            .then((resp) => resp.json())
            .then((resp) => decodeJson(decoderSingleArticle, resp)),

    postCreate: (article: Article) =>
        fetch(API_ROOT + "/articles", {
            method: "POST",
            headers: Api.headers(),
            body: JSON.stringify({ article }),
        })
            .then(fetchHandleValidationError)
            .then(fetchFailIfStatusNot200)
            .then((resp) => resp.json())
            .then((resp) => decodeJson(decoderSingleArticle, resp)),
}

/*

-- COMMENTS API
    
*/

export const ApiComments = {
    postCreate: (slug: string, comment: { body: string }) =>
        fetch(API_ROOT + `/articles/${slug}/comments`, {
            method: "POST",
            headers: Api.headers(),
            body: JSON.stringify({ comment }),
        })
            .then(fetchHandleValidationError)
            .then(fetchFailIfStatusNot200)
            .then((resp) => resp.json())
            .then((resp) => decodeJson(decoderSingleCommentResponse, resp)),

    delete: (slug: string, commentId: number) =>
        fetch(API_ROOT + `/articles/${slug}/comments/${commentId}`, {
            method: "DELETE",
            headers: Api.headers(),
        }).then(fetchFailIfStatusNot200),

    getForArticle: (slug: string) =>
        fetch(API_ROOT + `/articles/${slug}/comments`, {
            headers: Api.headers(),
        })
            .then(fetchFailIfStatusNot200)
            .then((resp) => resp.json())
            .then((resp) => decodeJson(decoderMultiCommentResponse, resp)),
}

/*

-- PROFILE API
    
*/

export const ApiProfile = {
    get: (username: string) =>
        fetch(API_ROOT + `/profiles/${username}`, {
            headers: Api.headers(),
        })
            .then(fetchHandleNotFoundError)
            .then(fetchFailIfStatusNot200)
            .then((resp) => resp.json())
            .then((resp) => decodeJson(decoderProfileResponse, resp)),

    postFollow: (username: string) =>
        fetch(API_ROOT + `/profiles/${username}/follow`, {
            method: "POST",
            headers: Api.headers(),
        })
            .then(fetchHandleValidationError)
            .then(fetchFailIfStatusNot200)
            .then((resp) => resp.json())
            .then((resp) => decodeJson(decoderProfileResponse, resp)),

    deleteFollow: (username: string) =>
        fetch(API_ROOT + `/profiles/${username}/follow`, {
            method: "DELETE",
            headers: Api.headers(),
        })
            .then(fetchHandleValidationError)
            .then(fetchFailIfStatusNot200)
            .then((resp) => resp.json())
            .then((resp) => decodeJson(decoderProfileResponse, resp)),
}

/*

-- REUSABLE FETCH UTILS
    
*/

function fetchFailIfStatusNot200(resp: Response): Promise<Response> {
    return resp.status === 200
        ? Promise.resolve(resp)
        : Promise.reject(
              new Error(resp.url + " => " + resp.status.toString() + " " + resp.statusText),
          )
}

function fetchHandleUnauthorizedError(resp: Response): Promise<Response> {
    if (resp.status === STATUS_CODES.Unauthorized) {
        return Promise.reject(new UnauthorizedError())
    }
    return Promise.resolve(resp)
}

function fetchHandleValidationError(resp: Response): Promise<Response> {
    if (resp.status === STATUS_CODES.ValidationError) {
        return resp
            .json()
            .then((json) => decodeJson(decoderValidationError, json))
            .then((result) => {
                return Promise.reject(new ValidationError(result.errors))
            })
    }
    return Promise.resolve(resp)
}

function fetchHandleNotFoundError(resp: Response): Promise<Response> {
    if (resp.status === STATUS_CODES.NotFound) {
        return Promise.reject(new NotFoundError())
    }
    return Promise.resolve(resp)
}
