import * as React from "react"
import * as marked from "marked"
import { ERTSComponent } from "../ERTS/ERTS-React"
import { UserWithToken, ArticleWithMeta, ApiArticles } from "../api"
import { containerCurrentUser } from "../SharedData/containerCurrentUser"
import { ifReachable, ERTSError } from "../ERTS/ERTS-SafeHelpers"
import { Link } from "react-router-dom"
import { reactRouterHistory } from "../SharedData/reactRouterHistory"
import { CommentArea } from "../Elements/CommentArea"
import { eventAddNotification } from "../SharedData/eventAddNotification"

type Props = { slug: string }

type StateLoading = { type: "Loading" }
type StateErrorLoading = { type: "ErrorLoading"; errorMessage: string }
type StateShowArticle = { type: "ShowArticle"; article: ArticleWithMeta }

type State = StateLoading | StateErrorLoading | StateShowArticle

export default class Article extends ERTSComponent<Props, State> {
    cleanupCurrentUser: () => void

    constructor(props: Props) {
        super(props)

        this.cleanupCurrentUser = containerCurrentUser.addListener(() => this.forceUpdate())

        this.state = { type: "Loading" }

        ApiArticles.get(this.props.slug)

            .then((articleResp) => {
                this.setState({ type: "ShowArticle", article: articleResp.article })
            })

            .catch((err) => {
                if (err instanceof ERTSError) {
                    this.setState({ type: "ErrorLoading", errorMessage: err.message })
                    return
                }
                console.error("UNKNOWN ERROR OCCURRED", err)
                this.setState({ type: "ErrorLoading", errorMessage: "Unknown" })
            })
    }

    componentWillUnmount(): void {
        this.cleanupCurrentUser()
    }

    deleteArticle(): void {
        // type-guard
        if (this.state.type !== "ShowArticle") return

        ApiArticles.delete(this.state.article.slug)

            .then(() => {
                reactRouterHistory.push("/")
            })

            .catch((err) => {
                console.error("Deletion of article failed.", err)
                eventAddNotification.trigger("Deletion of article failed.")
            })
    }

    render(): JSX.Element {
        const cuState = containerCurrentUser.state

        return (
            <div className="article-page">
                {(() => {
                    switch (cuState.type) {
                        case "Loaded":
                            switch (this.state.type) {
                                case "Loading":
                                    return <div className="container">Loading...</div>
                                case "ErrorLoading":
                                    return (
                                        <div className="container">
                                            <b>Error!</b>
                                            <pre>{this.state.errorMessage}</pre>
                                        </div>
                                    )
                                case "ShowArticle":
                                    return this.renderShowArticle(this.state, cuState.currentUser)
                                default:
                                    throw ifReachable(this.state)
                            }
                        case "Loading":
                            return <div className="container">Loading...</div>
                        default:
                            throw ifReachable(cuState)
                    }
                })()}
            </div>
        )
    }

    renderShowArticle(state: StateShowArticle, user: UserWithToken | null): JSX.Element {
        const markup = { __html: marked(state.article.body, { sanitize: true }) }
        const canModify = user !== null && user.username === state.article.author.username

        return (
            <React.Fragment>
                <div className="banner">
                    <div className="container">
                        <h1>{state.article.title}</h1>
                        {this.renderArticleMeta(state.article, canModify)}
                    </div>
                </div>

                <div className="container page">
                    <div className="row article-content">
                        <div className="col-xs-12">
                            <div dangerouslySetInnerHTML={markup} />

                            <ul className="tag-list">
                                {state.article.tagList.map((tag) => {
                                    return (
                                        <li className="tag-default tag-pill tag-outline" key={tag}>
                                            {tag}
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    </div>

                    <hr />

                    <div className="article-actions" />

                    <div className="row">
                        <CommentArea articleSlug={state.article.slug} />
                    </div>
                </div>
            </React.Fragment>
        )
    }

    renderArticleMeta(article: ArticleWithMeta, canModify: boolean): JSX.Element {
        return (
            <div className="article-meta">
                <Link to={`/@${article.author.username}`}>
                    {article.author.image !== null ? (
                        <img src={article.author.image} alt={article.author.username} />
                    ) : null}
                </Link>

                <div className="info">
                    <Link to={`/@${article.author.username}`} className="author">
                        {article.author.username}
                    </Link>
                    <span className="date">{new Date(article.createdAt).toDateString()}</span>
                </div>

                {canModify ? this.renderArticleActions(article) : null}
            </div>
        )
    }

    renderArticleActions(article: ArticleWithMeta): JSX.Element {
        return (
            <span>
                <Link to={`/editor/${article.slug}`} className="btn btn-outline-secondary btn-sm">
                    <i className="ion-edit" /> Edit Article
                </Link>

                <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => this.deleteArticle()}
                >
                    <i className="ion-trash-a" /> Delete Article
                </button>
            </span>
        )
    }
}
