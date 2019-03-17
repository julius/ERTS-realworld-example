import { ERTSComponent } from "../ERTS/ERTS-React"
import { ERTSEvent } from "../ERTS/ERTS-Event"
import { eventAddNotification } from "../SharedData/eventAddNotification"
import React = require("react")

interface Props {}

interface State {
    notifications: string[]
}

export class Notifications extends ERTSComponent<Props, State> {
    cleanupEventListener: () => void
    constructor(props: Props) {
        super(props)

        this.state = { notifications: [] }

        this.cleanupEventListener = eventAddNotification.addListener((message: string) => {
            this.setState({
                notifications: this.state.notifications.concat([message]),
            })
        })
    }

    componentWillUnmount(): void {
        this.cleanupEventListener()
    }

    render(): JSX.Element {
        return (
            <div className="Notifications">
                {this.state.notifications.map((notificationText, index) => (
                    <div
                        className="notification"
                        onClick={() => {
                            this.setState({
                                notifications: this.state.notifications.filter(
                                    (n, idx) => idx !== index,
                                ),
                            })
                        }}
                    >
                        {notificationText}
                    </div>
                ))}
            </div>
        )
    }
}
