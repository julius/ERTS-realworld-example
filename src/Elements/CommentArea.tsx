import * as React from "react"
import { ERTSComponent } from "../ERTS/ERTS-React"
import { containerCurrentUser } from "../SharedData/containerCurrentUser"
import { Link } from "react-router-dom"
import { CommentList } from "./CommentList"
import { CommentForm } from "./CommentForm"
import { User } from "../api"

interface Props {
    articleSlug: string
}

export class CommentArea extends ERTSComponent<Props, {}> {
    cleanupCurrentUser: () => void

    constructor(props: Props) {
        super(props)
        this.cleanupCurrentUser = containerCurrentUser.addListener(() => this.forceUpdate())
    }

    componentWillUnmount(): void {
        this.cleanupCurrentUser()
    }

    render(): JSX.Element {
        if (containerCurrentUser.state.type === "Loading") {
            return <div />
        }

        if (containerCurrentUser.state.currentUser === null) {
            return this.renderForGuest()
        } else {
            return this.renderForUser(containerCurrentUser.state.currentUser)
        }
    }

    renderForGuest(): JSX.Element {
        return (
            <div className="col-xs-12 col-md-8 offset-md-2">
                <p>
                    <Link to="/login">Sign in</Link>
                    &nbsp;or&nbsp;
                    <Link to="/register">sign up</Link>
                    &nbsp;to add comments on this article.
                </p>

                <CommentList articleSlug={this.props.articleSlug} currentUser={null} />
            </div>
        )
    }

    renderForUser(currentUser: User): JSX.Element {
        return (
            <div className="col-xs-12 col-md-8 offset-md-2">
                <CommentForm articleSlug={this.props.articleSlug} currentUser={currentUser} />
                <CommentList articleSlug={this.props.articleSlug} currentUser={currentUser} />
            </div>
        )
    }
}
