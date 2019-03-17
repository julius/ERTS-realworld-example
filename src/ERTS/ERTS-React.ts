import * as React from "react"

/**
 * React.Component with better Type-Safety
 *
 * No Lock-in: You can find-replace ERTSComponents with React.Components
 *             at any time without breaking anything.
 */
export class ERTSComponent<P, S> extends React.Component<P, S> {
    /**
     * The full state has to be given on every setState.
     * The partials allowed by React-Typings are not checked well.
     */
    setState(state: S): void {
        return super.setState(state)
    }
}
