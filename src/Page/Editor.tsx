import * as React from "react"
import { ERTSComponent } from "../ERTS/ERTS-React"
import { ListErrors } from "../Elements/ListErrors"
import * as Router from "react-router"
import {
    ApiArticles,
    Article,
    ValidationError,
    SingleArticlesResponse,
    NotFoundError,
} from "../api"
import { reactRouterHistory } from "../SharedData/reactRouterHistory"
import { DecodeJsonError, ifReachable } from "../ERTS/ERTS-SafeHelpers"

interface Props {
    slug?: string
}

type Form = {
    title: string
    description: string
    body: string
    tagInput: string
    tagList: string[]
}

/*

-- STATES
    
*/

type StateArticleLoading = { type: "ArticleLoading" }
type StateErrorLoading = { type: "ErrorLoading"; errorType: "NotFound" | "Unexpected" }
type StateFormUnsubmitted = { type: "FormUnsubmitted"; form: Form }
type StateFormSubmitting = { type: "FormSubmitting"; form: Form }
type StateFormWithErrors = {
    type: "FormWithErrors"
    form: Form
    errors: { [key: string]: string[] }
}
type State =
    | StateArticleLoading
    | StateErrorLoading
    | StateFormUnsubmitted
    | StateFormSubmitting
    | StateFormWithErrors

export default class Editor extends ERTSComponent<Props, State> {
    /*

        -- ARTICLE LOADING + FORM PREPARATION
        
    */

    constructor(props: Props) {
        super(props)
        this.state = this.clearFormState()

        if (this.props.slug !== undefined) {
            this.loadFromSlug(this.props.slug)
            return
        }
    }

    clearFormState(): State {
        return {
            type: "FormUnsubmitted",
            form: {
                title: "",
                description: "",
                body: "",
                tagInput: "",
                tagList: [],
            },
        }
    }

    loadFromSlug(slug: string): void {
        this.setState({ type: "ArticleLoading" })

        ApiArticles.get(slug)

            .then((articleResp) => {
                this.setState({
                    type: "FormUnsubmitted",
                    form: {
                        title: articleResp.article.title,
                        description: articleResp.article.description,
                        body: articleResp.article.body,
                        tagList: articleResp.article.tagList,
                        tagInput: "",
                    },
                })
            })

            .catch((error) => {
                if (error instanceof NotFoundError) {
                    this.setState({ type: "ErrorLoading", errorType: "NotFound" })
                    return
                }

                this.setState({ type: "ErrorLoading", errorType: "Unexpected" })
            })
    }

    /*

        -- PUBLISH ARTICLE
        
    */

    submitForm(): void {
        // type guard
        if (this.state.type !== "FormUnsubmitted" && this.state.type !== "FormWithErrors") {
            return
        }

        // Prepare Data
        const form = this.state.form

        const article: Article = {
            title: form.title,
            description: form.description,
            body: form.body,
            tagList: form.tagList,
        }

        // Network Request Create or Update
        const promiseCreateOrUpdate: Promise<SingleArticlesResponse> = (() => {
            if (this.props.slug !== undefined) {
                return ApiArticles.putUpdate({ ...article, slug: this.props.slug })
            } else {
                return ApiArticles.postCreate(article)
            }
        })()

        // Handle Request
        promiseCreateOrUpdate

            .then((articleResp) => {
                reactRouterHistory.push(`/article/${articleResp.article.slug}`)
            })

            .catch((error) => {
                if (error instanceof ValidationError) {
                    this.setState({
                        type: "FormWithErrors",
                        errors: error.messages,
                        form,
                    })
                    return
                }

                if (error instanceof DecodeJsonError) {
                    this.setState({
                        type: "FormWithErrors",
                        errors: {
                            "Unexpected server response": [error.suppliedJson].concat(
                                error.decodeErrorMessages,
                            ),
                        },
                        form,
                    })
                    return
                }

                if (error instanceof Error) {
                    this.setState({
                        type: "FormWithErrors",
                        errors: { "Unexpected Error": [error.message] },
                        form,
                    })
                    return
                }

                this.setState({
                    type: "FormWithErrors",
                    errors: { "Unexpected Error": [""] },
                    form,
                })
            })
    }

    /*

        -- MANAGE TAGS
        
    */

    addTag(): void {
        if (this.state.type !== "FormUnsubmitted" && this.state.type !== "FormWithErrors") {
            return
        }

        if (this.state.form.tagInput === "") {
            return
        }

        this.setState({
            ...this.state,
            form: {
                ...this.state.form,
                tagInput: "",
                tagList: this.state.form.tagList.concat([this.state.form.tagInput]),
            },
        })
    }

    removeTag(tag: string): void {
        if (this.state.type !== "FormUnsubmitted" && this.state.type !== "FormWithErrors") {
            return
        }

        this.setState({
            ...this.state,
            form: {
                ...this.state.form,
                tagList: this.state.form.tagList.filter((t) => t !== tag),
            },
        })
    }

    /*

        -- RENDER
        
    */

    render(): JSX.Element {
        return (
            <div className="editor-page">
                <div className="container page">
                    <div className="row">
                        <div className="col-md-10 offset-md-1 col-xs-12">
                            {(() => {
                                switch (this.state.type) {
                                    case "FormWithErrors":
                                        return (
                                            <React.Fragment>
                                                <ListErrors errors={this.state.errors} />
                                                {this.renderForm(this.state)}
                                            </React.Fragment>
                                        )

                                    case "FormUnsubmitted":
                                        return this.renderForm(this.state)

                                    case "FormSubmitting":
                                        return this.renderForm(this.state)

                                    case "ArticleLoading":
                                        return <div>Loading...</div>

                                    case "ErrorLoading":
                                        return this.renderErrorLoading(this.state)

                                    default:
                                        throw ifReachable(this.state)
                                }
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    renderErrorLoading(state: StateErrorLoading): JSX.Element {
        switch (state.errorType) {
            case "NotFound":
                return <div>ERROR: Article not found !</div>

            case "Unexpected":
                return (
                    <div>
                        ERROR: An unexpected error occured while loading the article. Please try
                        again later.
                    </div>
                )

            default:
                throw ifReachable(state.errorType)
        }
    }

    renderForm(
        state: StateFormSubmitting | StateFormUnsubmitted | StateFormWithErrors,
    ): JSX.Element {
        return (
            <form>
                <fieldset>
                    <fieldset className="form-group">
                        <input
                            className="form-control form-control-lg"
                            type="text"
                            placeholder="Article Title"
                            value={state.form.title}
                            onChange={(e) =>
                                this.setState({
                                    ...state,
                                    form: {
                                        ...state.form,
                                        title: e.target.value,
                                    },
                                })
                            }
                        />
                    </fieldset>

                    <fieldset className="form-group">
                        <input
                            className="form-control"
                            type="text"
                            placeholder="What's this article about?"
                            value={state.form.description}
                            onChange={(e) =>
                                this.setState({
                                    ...state,
                                    form: {
                                        ...state.form,
                                        description: e.target.value,
                                    },
                                })
                            }
                        />
                    </fieldset>

                    <fieldset className="form-group">
                        <textarea
                            className="form-control"
                            rows={8}
                            placeholder="Write your article (in markdown)"
                            value={state.form.body}
                            onChange={(e) =>
                                this.setState({
                                    ...state,
                                    form: {
                                        ...state.form,
                                        body: e.target.value,
                                    },
                                })
                            }
                        />
                    </fieldset>

                    <fieldset className="form-group">
                        <input
                            className="form-control"
                            type="text"
                            placeholder="Enter tags"
                            value={state.form.tagInput}
                            onChange={(e) =>
                                this.setState({
                                    ...state,
                                    form: {
                                        ...state.form,
                                        tagInput: e.target.value,
                                    },
                                })
                            }
                            onKeyUp={(ev) => {
                                if (ev.keyCode === 13) {
                                    ev.preventDefault()
                                    this.addTag()
                                }
                            }}
                        />

                        <div className="tag-list">
                            {state.form.tagList.map((tag) => (
                                <span className="tag-default tag-pill" key={tag}>
                                    <i
                                        className="ion-close-round"
                                        onClick={(ev) => this.removeTag(tag)}
                                    />
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </fieldset>

                    <button
                        className="btn btn-lg pull-xs-right btn-primary"
                        type="button"
                        disabled={state.type === "FormSubmitting"}
                        onClick={(ev) => {
                            ev.preventDefault()
                            this.submitForm()
                        }}
                    >
                        Publish Article
                    </button>
                </fieldset>
            </form>
        )
    }
}
