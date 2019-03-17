import * as React from "react"
import { Link } from "react-router-dom"
import { ApiAuth, ValidationError, Api } from "../api"
import { DecodeJsonError } from "../ERTS/ERTS-SafeHelpers"
import { reactRouterHistory } from "../SharedData/reactRouterHistory"
import { ERTSComponent } from "../ERTS/ERTS-React"
import { ListErrors } from "../Elements/ListErrors"
import { containerCurrentUser } from "../SharedData/containerCurrentUser"

interface State {
    username: string
    email: string
    password: string
    inProgress: boolean
    errors: { [key: string]: string[] } | undefined
}

export default class Register extends ERTSComponent<{}, State> {
    constructor(props: {}) {
        super(props)
        this.state = {
            username: "",
            email: "",
            password: "",
            inProgress: false,
            errors: undefined,
        }
    }

    handleSubmit(ev: React.FormEvent<HTMLFormElement>): void {
        ev.preventDefault()
        this.setState({ ...this.state, inProgress: true })

        // Register
        ApiAuth.postRegister(this.state.username, this.state.email, this.state.password)

            .then((userResp) => {
                Api.setAuthToken(userResp.user.token)
                containerCurrentUser.setState({ type: "Loaded", currentUser: userResp.user })
                reactRouterHistory.push("/")
            })

            .catch((err) => {
                if (err instanceof ValidationError) {
                    this.setState({
                        ...this.state,
                        inProgress: false,
                        errors: err.messages,
                    })
                    return
                }

                if (err instanceof DecodeJsonError) {
                    this.setState({
                        ...this.state,
                        inProgress: false,
                        errors: {
                            "Unexpected server response": [err.suppliedJson].concat(
                                err.decodeErrorMessages,
                            ),
                        },
                    })
                    return
                }

                this.setState({
                    ...this.state,
                    inProgress: false,
                    errors: { "Unexpected Error": [""] },
                })
            })
    }

    render(): JSX.Element {
        return (
            <div className="auth-page">
                <div className="container page">
                    <div className="row">
                        <div className="col-md-6 offset-md-3 col-xs-12">
                            <h1 className="text-xs-center">Sign Up</h1>
                            <p className="text-xs-center">
                                <Link to="/login">Have an account?</Link>
                            </p>

                            {this.state.errors !== undefined ? (
                                <ListErrors errors={this.state.errors} />
                            ) : null}

                            <form onSubmit={(ev) => this.handleSubmit(ev)}>
                                <fieldset>
                                    <fieldset className="form-group">
                                        <input
                                            className="form-control form-control-lg"
                                            type="text"
                                            placeholder="Username"
                                            value={this.state.username}
                                            onChange={(e) =>
                                                this.setState({
                                                    ...this.state,
                                                    username: e.target.value,
                                                })
                                            }
                                        />
                                    </fieldset>

                                    <fieldset className="form-group">
                                        <input
                                            className="form-control form-control-lg"
                                            type="email"
                                            placeholder="Email"
                                            value={this.state.email}
                                            onChange={(e) =>
                                                this.setState({
                                                    ...this.state,
                                                    email: e.target.value,
                                                })
                                            }
                                        />
                                    </fieldset>

                                    <fieldset className="form-group">
                                        <input
                                            className="form-control form-control-lg"
                                            type="password"
                                            placeholder="Password"
                                            value={this.state.password}
                                            onChange={(e) =>
                                                this.setState({
                                                    ...this.state,
                                                    password: e.target.value,
                                                })
                                            }
                                        />
                                    </fieldset>

                                    <button
                                        className="btn btn-lg btn-primary pull-xs-right"
                                        type="submit"
                                        disabled={this.state.inProgress}
                                    >
                                        Sign up
                                    </button>
                                </fieldset>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
