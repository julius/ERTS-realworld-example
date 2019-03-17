import * as ReactDOM from "react-dom"
import * as React from "react"
import { Switch, Route, RouteComponentProps, Router } from "react-router-dom"
import { ERTSComponent } from "./ERTS/ERTS-React"
import { ApiAuth, Api, User, UnauthorizedError } from "./api"
import { ifReachable } from "./ERTS/ERTS-SafeHelpers"
import Header from "./Elements/Header"
import Home from "./Page/Home"
import Login from "./Page/Login"
import Register from "./Page/Register"
import Profile from "./Page/Profile"
import Editor from "./Page/Editor"
import Article from "./Page/Article"
import Settings from "./Page/Settings"
import { APP_NAME } from "./config"
import NotFound from "./Page/NotFound"
import { containerCurrentUser } from "./SharedData/containerCurrentUser"
import { reactRouterHistory } from "./SharedData/reactRouterHistory"
import { Notifications } from "./Elements/Notifications"
import { eventAddNotification } from "./SharedData/eventAddNotification"

class App extends ERTSComponent<{}, {}> {
    /*

    -- LOADING

    */

    cleanupCurrentUser: () => void

    constructor(props: {}) {
        super(props)

        ApiAuth.getUser()

            .then((user) => {
                // User is logged in. We have a user object with a token.
                Api.setAuthToken(user.token)

                containerCurrentUser.setState({
                    type: "Loaded",
                    currentUser: user,
                })
            })

            .catch((err) => {
                // Assume user is a guest
                containerCurrentUser.setState({
                    type: "Loaded",
                    currentUser: null,
                })

                if (err instanceof UnauthorizedError) {
                    // User is a guest. We have no user object.
                    return
                }

                // ERROR
                console.error("Error while loading user.", err)
                eventAddNotification.trigger("Error while loading user.")
            })

        this.cleanupCurrentUser = containerCurrentUser.addListener(() => this.forceUpdate())
    }

    componentWillUnmount(): void {
        this.cleanupCurrentUser()
    }

    /*

    -- RENDERING

    */

    render(): JSX.Element {
        const cuState = containerCurrentUser.state

        switch (cuState.type) {
            case "Loading":
                return <div className="container">Loading...</div>

            case "Loaded":
                return (
                    <Router history={reactRouterHistory}>
                        <Switch>
                            <Route path="/" render={() => this.renderRoutes(cuState.currentUser)} />
                        </Switch>
                    </Router>
                )

            default:
                throw ifReachable(cuState)
        }
    }

    renderRoutes(currentUser: User | null): JSX.Element {
        return (
            <React.Fragment>
                <Notifications />
                <Header appName={APP_NAME} currentUser={currentUser} />

                <Switch>
                    <Route exact path="/" render={() => <Home />} />
                    <Route path="/login" render={() => <Login />} />
                    <Route path="/register" render={() => <Register />} />
                    <Route
                        path="/editor/:slug"
                        render={(props: RouteComponentProps<{ slug: string }>) => (
                            <Editor
                                key={"editor-" + props.match.params.slug}
                                slug={props.match.params.slug}
                            />
                        )}
                    />
                    <Route path="/editor" render={() => <Editor key={"editor-new"} />} />
                    <Route
                        path="/article/:slug"
                        render={(props: RouteComponentProps<{ slug: string }>) => (
                            <Article
                                key={"article-" + props.match.params.slug}
                                slug={props.match.params.slug}
                            />
                        )}
                    />
                    <Route path="/settings" render={() => <Settings />} />
                    <Route
                        path="/@:username/favorites"
                        render={(props: RouteComponentProps<{ username: string }>) => (
                            <Profile
                                key={"profile-" + props.match.params.username}
                                username={props.match.params.username}
                                tab="favorites"
                                currentUser={currentUser}
                            />
                        )}
                    />
                    <Route
                        path="/@:username"
                        render={(props: RouteComponentProps<{ username: string }>) => (
                            <Profile
                                key={"profile-" + props.match.params.username}
                                username={props.match.params.username}
                                tab="articles"
                                currentUser={currentUser}
                            />
                        )}
                    />
                    <Route render={() => <NotFound />} />
                </Switch>
            </React.Fragment>
        )
    }
}

ReactDOM.render(<App />, document.getElementById("root"))
