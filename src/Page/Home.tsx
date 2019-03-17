import * as React from "react"
import { ApiAuth } from "../api"
import { APP_NAME } from "../config"
import TagList from "../Elements/TagList"
import ArticleList from "../Elements/ArticleList"
import { ERTSComponent } from "../ERTS/ERTS-React"
import { ifReachable } from "../ERTS/ERTS-SafeHelpers"

interface StateTabAll {
    tab: "all"
}
interface StateTabFeed {
    tab: "feed"
}
interface StateTabTag {
    tab: "tag"
    tag: string
}
type State = StateTabAll | StateTabFeed | StateTabTag

export default class Home extends ERTSComponent<{}, State> {
    constructor(props: {}) {
        super(props)
        this.state = { tab: "all" }
    }

    handleTabAll(): void {
        this.setState({ tab: "all" })
    }

    handleTabFeed(): void {
        this.setState({ tab: "feed" })
    }

    handleTagSelection(tag: string): void {
        this.setState({
            tab: "tag",
            tag,
        })
    }

    render(): JSX.Element {
        return (
            <div className="home-page">
                {ApiAuth.isLoggedIn() === false ? this.renderBanner() : null}

                <div className="container page">
                    <div className="row">
                        <div className="col-xs-12 col-md-9">
                            {this.renderTabs()}

                            {(() => {
                                switch (this.state.tab) {
                                    case "all":
                                        return <ArticleList key={"all"} source={{ type: "all" }} />
                                    case "feed":
                                        return (
                                            <ArticleList key={"feed"} source={{ type: "feed" }} />
                                        )
                                    case "tag":
                                        return (
                                            <ArticleList
                                                key={"tag-" + this.state.tag}
                                                source={{
                                                    type: "tag",
                                                    tag: this.state.tag,
                                                }}
                                            />
                                        )
                                    default:
                                        throw ifReachable(this.state)
                                }
                            })()}
                        </div>

                        <div className="col-xs-12 col-md-3">
                            <div className="sidebar">
                                <p>Popular Tags</p>

                                <TagList
                                    handleTagSelection={(tag) => this.handleTagSelection(tag)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    renderTabs(): JSX.Element {
        return (
            <div className="feed-toggle">
                <ul className="nav nav-pills outline-active">
                    <li className="nav-item">
                        <a
                            href="#"
                            className={this.state.tab === "feed" ? "nav-link active" : "nav-link"}
                            onClick={(ev) => {
                                ev.preventDefault()
                                this.handleTabFeed()
                            }}
                        >
                            Your Feed
                        </a>
                    </li>

                    <li className="nav-item">
                        <a
                            href="#"
                            className={this.state.tab === "all" ? "nav-link active" : "nav-link"}
                            onClick={(ev) => {
                                ev.preventDefault()
                                this.handleTabAll()
                            }}
                        >
                            Global Feed
                        </a>
                    </li>

                    {this.state.tab === "tag" ? (
                        <li className="nav-item">
                            <a href="#" className="nav-link active">
                                <i className="ion-pound" /> {this.state.tag}
                            </a>
                        </li>
                    ) : null}
                </ul>
            </div>
        )
    }

    renderBanner(): JSX.Element {
        return (
            <div className="banner">
                <div className="container">
                    <h1 className="logo-font">{APP_NAME.toLowerCase()}</h1>
                    <p>A place to share your knowledge.</p>
                </div>
            </div>
        )
    }
}
