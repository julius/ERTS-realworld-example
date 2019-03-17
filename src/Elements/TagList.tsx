import * as React from "react"
import { ApiTags } from "../api"
import { ifReachable } from "../ERTS/ERTS-SafeHelpers"
import { ERTSComponent } from "../ERTS/ERTS-React"

interface Props {
    handleTagSelection: (tag: string) => void
}

/*

-- STATES

*/

interface StateLoading {
    type: "Loading"
}
interface StateList {
    type: "List"
    tags: string[]
}
interface StateErrorLoading {
    type: "ErrorLoading"
}
type State = StateLoading | StateList | StateErrorLoading

/*

-- COMPONENT

*/

export default class TagList extends ERTSComponent<Props, State> {
    constructor(props: Props) {
        super(props)

        this.state = { type: "Loading" }

        // Load all the tags
        ApiTags.getAll()
            .then((tags: string[]) => {
                this.setState({ type: "List", tags })
            })
            .catch(() => {
                this.setState({ type: "ErrorLoading" })
            })
    }

    render(): JSX.Element {
        switch (this.state.type) {
            case "List":
                return this.renderTagList(this.state.tags)
            case "Loading":
                return <div>Loading Tags...</div>
            case "ErrorLoading":
                return <div>(Tags not available right now...)</div>
            default:
                throw ifReachable(this.state)
        }
    }

    renderTagList(tags: string[]): JSX.Element {
        return (
            <div className="tag-list">
                {tags.map((tag) => (
                    <a
                        href=""
                        className="tag-default tag-pill"
                        key={tag}
                        onClick={(ev) => {
                            ev.preventDefault()
                            this.props.handleTagSelection(tag)
                        }}
                    >
                        {tag}
                    </a>
                ))}
            </div>
        )
    }
}
