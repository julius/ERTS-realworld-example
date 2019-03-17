import * as React from "react"
import { ERTSComponent } from "../ERTS/ERTS-React"
import { Link } from "react-router-dom"

export default class NotFound extends ERTSComponent<{}, {}> {
    render(): JSX.Element {
        return (
            <div className="container">
                <h1>404 Page not found</h1>
                <p>
                    Goto: <Link to="/">Global Feed</Link>
                </p>
            </div>
        )
    }
}
