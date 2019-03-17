import * as React from "react"

type Props = {
    errors: { [key: string]: string[] }
}

export const ListErrors = (props: Props) => (
    <ul className="error-messages">
        {Object.keys(props.errors).map((key) => (
            <li key={"error-" + key}>
                {key} {props.errors[key].join(" / ")}
            </li>
        ))}
    </ul>
)
