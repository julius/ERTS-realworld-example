import * as React from "react"
import { ERTSComponent } from "../ERTS/ERTS-React"
import {
    User,
    Profile as DataProfile,
    ApiArticles,
    ArticleWithMeta,
    ApiProfile,
    ProfileResponse,
} from "../api"
import ArticleList from "../Elements/ArticleList"
import { ifReachable } from "../ERTS/ERTS-SafeHelpers"
import { Link } from "react-router-dom"
import { eventAddNotification } from "../SharedData/eventAddNotification"

interface Props {
    username: string
    tab: "articles" | "favorites"
    currentUser: User | null
}

type StateLoading = { type: "Loading" }
type StateErrorLoading = { type: "ErrorLoading" }
type StateShowProfile = { type: "ShowProfile"; profile: DataProfile }

type State = StateLoading | StateErrorLoading | StateShowProfile

export default class Profile extends ERTSComponent<Props, State> {
    isProfileLoadCanceled = false

    constructor(props: Props) {
        super(props)

        this.state = { type: "Loading" }

        ApiProfile.get(this.props.username)
            .then((profileResp) => {
                if (this.isProfileLoadCanceled) return

                this.setState({
                    type: "ShowProfile",
                    profile: profileResp.profile,
                })
            })

            .catch(() => {
                if (this.isProfileLoadCanceled) return

                this.setState({ type: "ErrorLoading" })
            })
    }

    componentWillUnmount(): void {
        this.isProfileLoadCanceled = true
    }

    follow(username: string): void {
        // type guard for state
        if (this.state.type !== "ShowProfile") return

        const state = this.state

        // optimistic update
        this.setState({
            ...state,
            profile: {
                ...state.profile,
                following: true,
            },
        })

        // execute
        ApiProfile.postFollow(username).catch((err) => {
            this.setState({
                ...state,
                profile: {
                    ...state.profile,
                    following: false,
                },
            })

            console.error("Following failed.", err)
            eventAddNotification.trigger("Following failed.")
        })
    }

    unfollow(username: string): void {
        // type guard for state
        if (this.state.type !== "ShowProfile") return

        const state = this.state

        // optimistic update
        this.setState({
            ...state,
            profile: {
                ...state.profile,
                following: false,
            },
        })

        // execute
        ApiProfile.deleteFollow(username).catch((err) => {
            this.setState({
                ...state,
                profile: {
                    ...state.profile,
                    following: true,
                },
            })

            console.error("Unfollowing failed.", err)
            eventAddNotification.trigger("Unfollowing failed.")
        })
    }

    render(): JSX.Element {
        switch (this.state.type) {
            case "Loading":
                return <div className="container">Loading ...</div>
            case "ErrorLoading":
                return (
                    <div className="container">Error while loading profile. Try again later.</div>
                )
            case "ShowProfile":
                return this.renderProfile(this.state)
            default:
                throw ifReachable(this.state)
        }
    }

    renderProfile(state: StateShowProfile): JSX.Element {
        const isUser =
            this.props.currentUser !== null &&
            state.profile.username === this.props.currentUser.username

        return (
            <div className="profile-page">
                <div className="user-info">
                    <div className="container">
                        <div className="row">
                            <div className="col-xs-12 col-md-10 offset-md-1">
                                {state.profile.image !== null ? (
                                    <img
                                        src={state.profile.image}
                                        className="user-img"
                                        alt={state.profile.username}
                                    />
                                ) : null}

                                <h4>{state.profile.username}</h4>
                                <p>{state.profile.bio}</p>

                                {isUser ? this.renderEditProfileSettings() : null}
                                {isUser ? null : this.renderFollowUserButton(state)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container">
                    <div className="row">
                        <div className="col-xs-12 col-md-10 offset-md-1">
                            <div className="articles-toggle">{this.renderTabs(state.profile)}</div>

                            {(() => {
                                switch (this.props.tab) {
                                    case "articles":
                                        return (
                                            <ArticleList
                                                key={state.profile.username + "-author"}
                                                source={{
                                                    type: "author",
                                                    author: state.profile.username,
                                                }}
                                            />
                                        )

                                    case "favorites":
                                        return (
                                            <ArticleList
                                                key={state.profile.username + "-favorites"}
                                                source={{
                                                    type: "favorites",
                                                    author: state.profile.username,
                                                }}
                                            />
                                        )

                                    default:
                                        throw ifReachable(this.props.tab)
                                }
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    renderTabs(profile: DataProfile): JSX.Element {
        return (
            <ul className="nav nav-pills outline-active">
                <li className="nav-item">
                    <Link
                        className={"nav-link" + (this.props.tab === "articles" ? " active" : "")}
                        to={`/@${profile.username}`}
                    >
                        My Articles
                    </Link>
                </li>

                <li className="nav-item">
                    <Link
                        className={"nav-link" + (this.props.tab === "favorites" ? " active" : "")}
                        to={`/@${profile.username}/favorites`}
                    >
                        Favorited Articles
                    </Link>
                </li>
            </ul>
        )
    }

    renderFollowUserButton(state: StateShowProfile): JSX.Element {
        let classes = "btn btn-sm action-btn"
        if (state.profile.following) {
            classes += " btn-secondary"
        } else {
            classes += " btn-outline-secondary"
        }

        return (
            <button
                className={classes}
                onClick={(ev) => {
                    ev.preventDefault()
                    if (state.profile.following) {
                        this.unfollow(state.profile.username)
                    } else {
                        this.follow(state.profile.username)
                    }
                }}
            >
                <i className="ion-plus-round" />
                &nbsp;
                {state.profile.following ? "Unfollow" : "Follow"} {state.profile.username}
            </button>
        )
    }

    renderEditProfileSettings(): JSX.Element {
        return (
            <Link to="/settings" className="btn btn-sm btn-outline-secondary action-btn">
                <i className="ion-gear-a" /> Edit Profile Settings
            </Link>
        )
    }
}
