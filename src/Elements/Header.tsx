import * as React from "react"
import { Link } from "react-router-dom"
import { User } from "../api"
import { ERTSComponent } from "../ERTS/ERTS-React"

interface Props {
    appName: string
    currentUser: User | null
}

export default class Header extends ERTSComponent<Props, {}> {
    render(): JSX.Element {
        return (
            <nav className="navbar navbar-light">
                <div className="container">
                    <Link to="/" className="navbar-brand">
                        {this.props.appName.toLowerCase()}
                    </Link>

                    {this.props.currentUser === null
                        ? LoggedOutView()
                        : LoggedInView(this.props.currentUser)}
                </div>
            </nav>
        )
    }
}

function LoggedOutView(): JSX.Element {
    return (
        <ul className="nav navbar-nav pull-xs-right">
            <li className="nav-item">
                <Link to="/" className="nav-link">
                    Home
                </Link>
            </li>

            <li className="nav-item">
                <Link to="/login" className="nav-link">
                    Sign in
                </Link>
            </li>

            <li className="nav-item">
                <Link to="/register" className="nav-link">
                    Sign up
                </Link>
            </li>
        </ul>
    )
}

function LoggedInView(currentUser: User): JSX.Element {
    return (
        <ul className="nav navbar-nav pull-xs-right">
            <li className="nav-item">
                <Link to="/" className="nav-link">
                    Home
                </Link>
            </li>

            <li className="nav-item">
                <Link to="/editor" className="nav-link">
                    <i className="ion-compose" />
                    &nbsp;New Post
                </Link>
            </li>

            <li className="nav-item">
                <Link to="/settings" className="nav-link">
                    <i className="ion-gear-a" />
                    &nbsp;Settings
                </Link>
            </li>

            <li className="nav-item">
                <Link to={`/@${currentUser.username}`} className="nav-link">
                    {currentUser.image !== null ? (
                        <img
                            src={currentUser.image}
                            className="user-pic"
                            alt={currentUser.username}
                        />
                    ) : null}

                    {currentUser.username}
                </Link>
            </li>
        </ul>
    )
}
