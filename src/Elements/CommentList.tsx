import * as React from "react"
import { ERTSComponent } from "../ERTS/ERTS-React"
import { Comment, User, ApiComments } from "./../api"
import { ifReachable } from "../ERTS/ERTS-SafeHelpers"
import { Link } from "react-router-dom"
import { eventCommentListUpdate } from "../SharedData/eventCommentListUpdate"
import { eventAddNotification } from "../SharedData/eventAddNotification"

interface Props {
    articleSlug: string
    currentUser: User | null
}

type StateLoading = { type: "Loading" }
type StateErrorLoading = { type: "ErrorLoading" }
type StateShowList = { type: "ShowList"; comments: Comment[] }
type State = StateLoading | StateErrorLoading | StateShowList

export class CommentList extends ERTSComponent<Props, State> {
    cleanupCommentListUpdateListener: () => void

    constructor(props: Props) {
        super(props)

        this.state = { type: "Loading" }
        this.loadComments()

        this.cleanupCommentListUpdateListener = eventCommentListUpdate.addListener(() => {
            this.setState({ type: "Loading" })
            this.loadComments()
        })
    }

    componentWillUnmount(): void {
        this.cleanupCommentListUpdateListener()
    }

    loadComments(): void {
        ApiComments.getForArticle(this.props.articleSlug)
            .then((commentsResp) => {
                this.setState({ type: "ShowList", comments: commentsResp.comments })
            })
            .catch(() => {
                this.setState({ type: "ErrorLoading" })
            })
    }

    deleteComment(id: number): void {
        ApiComments.delete(this.props.articleSlug, id)

            .then(() => {
                if (this.state.type !== "ShowList") return

                this.setState({
                    ...this.state,
                    comments: this.state.comments.filter((c) => c.id !== id),
                })
            })

            .catch((err) => {
                console.error("Deletion of comment failed.", err)
                eventAddNotification.trigger("Deletion of comment failed.")
            })
    }

    render(): JSX.Element {
        return (
            <div>
                {(() => {
                    switch (this.state.type) {
                        case "Loading":
                            return <span>"Loading..."</span>
                        case "ErrorLoading":
                            return <span>(Comments failed loading.)</span>

                        case "ShowList":
                            return this.renderList(this.state)

                        default:
                            throw ifReachable(this.state)
                    }
                })()}
            </div>
        )
    }

    renderList(state: StateShowList): JSX.Element {
        return (
            <React.Fragment>
                {state.comments.map((comment) => {
                    const canDelete =
                        this.props.currentUser !== null &&
                        this.props.currentUser.username === comment.author.username

                    return (
                        <div className="card">
                            <div className="card-block">
                                <p className="card-text">{comment.body}</p>
                            </div>
                            <div className="card-footer">
                                <Link
                                    to={`/@${comment.author.username}`}
                                    className="comment-author"
                                >
                                    {comment.author.image !== null ? (
                                        <img
                                            src={comment.author.image}
                                            className="comment-author-img"
                                            alt={comment.author.username}
                                        />
                                    ) : null}
                                </Link>
                                &nbsp;
                                <Link
                                    to={`/@${comment.author.username}`}
                                    className="comment-author"
                                >
                                    {comment.author.username}
                                </Link>
                                <span className="date-posted">
                                    {new Date(comment.createdAt).toDateString()}
                                </span>
                                {canDelete ? (
                                    <span className="mod-options">
                                        <i
                                            className="ion-trash-a"
                                            onClick={() => this.deleteComment(comment.id)}
                                        />
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    )
                })}
            </React.Fragment>
        )
    }
}
