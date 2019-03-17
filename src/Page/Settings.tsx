import * as React from "react"
import { ERTSComponent } from "../ERTS/ERTS-React"
import { ListErrors } from "../Elements/ListErrors"
import { ApiAuth, ValidationError } from "../api"
import { ERTSError, ifReachable, DecodeJsonError } from "../ERTS/ERTS-SafeHelpers"
import { reactRouterHistory } from "../SharedData/reactRouterHistory"
import { containerCurrentUser } from "../SharedData/containerCurrentUser"

type Form = {
    image: string
    username: string
    bio: string
    email: string
    password: string
}

/*

-- STATES
    
*/

type StateSettingsLoading = { type: "SettingsLoading" }
type StateErrorLoading = { type: "ErrorLoading"; errorMessage: string }
type StateFormUnsubmitted = { type: "FormUnsubmitted"; form: Form }
type StateFormSubmitting = { type: "FormSubmitting"; form: Form }
type StateFormWithErrors = {
    type: "FormWithErrors"
    form: Form
    errors: { [key: string]: string[] }
}

type State =
    | StateSettingsLoading
    | StateErrorLoading
    | StateFormUnsubmitted
    | StateFormSubmitting
    | StateFormWithErrors

export default class Settings extends ERTSComponent<{}, State> {
    isUserLoadCanceled = false
    isSaveCanceled = false

    constructor(props: {}) {
        super(props)
        this.state = { type: "SettingsLoading" }

        ApiAuth.getUser()

            .then((user) => {
                if (this.isUserLoadCanceled) return

                const form: Form = {
                    ...user,
                    bio: user.bio !== null ? user.bio : "",
                    image: user.image !== null ? user.image : "",
                    password: "",
                }
                this.setState({ type: "FormUnsubmitted", form })
            })

            .catch((err) => {
                if (this.isUserLoadCanceled) return

                if (err instanceof ERTSError) {
                    this.setState({ type: "ErrorLoading", errorMessage: err.message })
                    return
                }
                this.setState({ type: "ErrorLoading", errorMessage: "Loading failed." })
            })
    }

    componentWillUnmount(): void {
        this.isSaveCanceled = true
        this.isUserLoadCanceled = true
    }

    logout(): void {
        ApiAuth.logout()
            .then(() => reactRouterHistory.push("/"))
            .catch(() => {})
    }

    submitForm(): void {
        // type guard
        if (this.state.type !== "FormUnsubmitted" && this.state.type !== "FormWithErrors") {
            return
        }

        const form = this.state.form
        let requestSave

        if (this.state.form.password === "") {
            const { password, ...formWithoutPassword } = this.state.form
            requestSave = ApiAuth.putSave(formWithoutPassword)
        } else {
            requestSave = ApiAuth.putSave(this.state.form)
        }

        requestSave
            .then((userResp) => {
                if (this.isSaveCanceled) return

                // make sure the entire app reflects the new user
                containerCurrentUser.setState({
                    type: "Loaded",
                    currentUser: userResp.user,
                })

                // redirect to user profile -> user can see his changes
                reactRouterHistory.push(`/@` + userResp.user.username)
            })

            .catch((error) => {
                if (this.isSaveCanceled) return

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

    render(): JSX.Element {
        return (
            <div className="settings-page">
                <div className="container page">
                    <div className="row">
                        <div className="col-md-6 offset-md-3 col-xs-12">
                            <h1 className="text-xs-center">Your Settings</h1>
                            {(() => {
                                switch (this.state.type) {
                                    case "FormWithErrors":
                                        return (
                                            <React.Fragment>
                                                <ListErrors errors={this.state.errors} />
                                                {this.renderSettingsForm(this.state)}
                                            </React.Fragment>
                                        )

                                    case "FormUnsubmitted":
                                        return this.renderSettingsForm(this.state)

                                    case "FormSubmitting":
                                        return this.renderSettingsForm(this.state)

                                    case "SettingsLoading":
                                        return <div>Loading...</div>

                                    case "ErrorLoading":
                                        return (
                                            <div>
                                                <b>Error</b>
                                                <br />
                                                <pre>{this.state.errorMessage}</pre>
                                            </div>
                                        )

                                    default:
                                        throw ifReachable(this.state)
                                }
                            })()}

                            <hr />

                            <button
                                className="btn btn-outline-danger"
                                onClick={() => this.logout()}
                            >
                                Or click here to logout.
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    renderSettingsForm(
        state: StateFormSubmitting | StateFormUnsubmitted | StateFormWithErrors,
    ): JSX.Element {
        return (
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    this.submitForm()
                }}
            >
                <fieldset>
                    <fieldset className="form-group">
                        <input
                            className="form-control"
                            type="text"
                            placeholder="URL of profile picture"
                            value={state.form.image}
                            onChange={(e) =>
                                this.setState({
                                    ...state,
                                    form: { ...state.form, image: e.target.value },
                                })
                            }
                        />
                    </fieldset>

                    <fieldset className="form-group">
                        <input
                            className="form-control form-control-lg"
                            type="text"
                            placeholder="Username"
                            value={state.form.username}
                            onChange={(e) =>
                                this.setState({
                                    ...state,
                                    form: { ...state.form, username: e.target.value },
                                })
                            }
                        />
                    </fieldset>

                    <fieldset className="form-group">
                        <textarea
                            className="form-control form-control-lg"
                            rows={8}
                            placeholder="Short bio about you"
                            value={state.form.bio}
                            onChange={(e) =>
                                this.setState({
                                    ...state,
                                    form: { ...state.form, bio: e.target.value },
                                })
                            }
                        />
                    </fieldset>

                    <fieldset className="form-group">
                        <input
                            className="form-control form-control-lg"
                            type="email"
                            placeholder="Email"
                            value={state.form.email}
                            onChange={(e) =>
                                this.setState({
                                    ...state,
                                    form: { ...state.form, email: e.target.value },
                                })
                            }
                        />
                    </fieldset>

                    <fieldset className="form-group">
                        <input
                            className="form-control form-control-lg"
                            type="password"
                            placeholder="New Password"
                            value={state.form.password}
                            onChange={(e) =>
                                this.setState({
                                    ...state,
                                    form: { ...state.form, password: e.target.value },
                                })
                            }
                        />
                    </fieldset>

                    <button
                        className="btn btn-lg btn-primary pull-xs-right"
                        type="submit"
                        disabled={this.state.type === "FormSubmitting"}
                    >
                        Update Settings
                    </button>
                </fieldset>
            </form>
        )
    }
}
