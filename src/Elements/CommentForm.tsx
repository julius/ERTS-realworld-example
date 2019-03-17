import * as React from "react"
import { ERTSComponent } from "../ERTS/ERTS-React"
import { User, ApiComments, ValidationError } from "../api"
import { ListErrors } from "./ListErrors"
import { DecodeJsonError } from "../ERTS/ERTS-SafeHelpers"
import { eventCommentListUpdate } from "../SharedData/eventCommentListUpdate"

interface Props {
    articleSlug: string
    currentUser: User
}

type StateFormUnsubmitted = { type: "FormUnsubmitted"; body: string }
type StateFormSubmitting = { type: "FormSubmitting"; body: string }
type StateFormWithErrors = {
    type: "FormWithErrors"
    body: string
    errors: { [key: string]: string[] }
}
type State = StateFormUnsubmitted | StateFormSubmitting | StateFormWithErrors

export class CommentForm extends ERTSComponent<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { type: "FormUnsubmitted", body: "" }
    }

    createComment(): void {
        ApiComments.postCreate(this.props.articleSlug, { body: this.state.body })

            .then(() => {
                this.setState({ type: "FormUnsubmitted", body: "" })
                eventCommentListUpdate.trigger()
            })

            .catch((error) => {
                if (error instanceof ValidationError) {
                    this.setState({
                        ...this.state,
                        type: "FormWithErrors",
                        errors: error.messages,
                    })
                    return
                }

                if (error instanceof DecodeJsonError) {
                    this.setState({
                        ...this.state,
                        type: "FormWithErrors",
                        errors: {
                            "Unexpected server response": [error.suppliedJson].concat(
                                error.decodeErrorMessages,
                            ),
                        },
                    })
                    return
                }

                if (error instanceof Error) {
                    this.setState({
                        ...this.state,
                        type: "FormWithErrors",
                        errors: { "Unexpected Error": [error.message] },
                    })
                    return
                }

                this.setState({
                    ...this.state,
                    type: "FormWithErrors",
                    errors: { "Unexpected Error": [""] },
                })
            })
        this.setState({ type: "FormUnsubmitted", body: "" })
    }

    render(): JSX.Element {
        return (
            <React.Fragment>
                {this.state.type === "FormWithErrors" ? (
                    <ListErrors errors={this.state.errors} />
                ) : null}

                <form
                    className="card comment-form"
                    onSubmit={(e) => {
                        e.preventDefault()
                        this.createComment()
                    }}
                >
                    <div className="card-block">
                        <textarea
                            className="form-control"
                            placeholder="Write a comment..."
                            value={this.state.body}
                            onChange={(e) => {
                                this.setState({ ...this.state, body: e.target.value })
                            }}
                            rows={3}
                        />
                    </div>
                    <div className="card-footer">
                        {this.props.currentUser.image !== null ? (
                            <img
                                src={this.props.currentUser.image}
                                className="comment-author-img"
                                alt={this.props.currentUser.username}
                            />
                        ) : null}

                        <button
                            className="btn btn-sm btn-primary"
                            disabled={this.state.type === "FormSubmitting"}
                            type="submit"
                        >
                            Post Comment
                        </button>
                    </div>
                </form>
            </React.Fragment>
        )
    }
}
