import * as React from "react"

type Props = {
    articlesCount: number
    currentPage: number
    onSetPage: (page: number) => void
}

export const ListPagination = (props: Props) => {
    if (props.articlesCount <= 10) {
        return null
    }

    let range: number[] = []
    for (let i = 0; i < Math.ceil(props.articlesCount / 10); ++i) {
        range = range.concat([i])
    }

    return (
        <nav>
            <ul className="pagination">
                {range.map((v) => {
                    const isCurrent = v === props.currentPage
                    return (
                        <li
                            className={isCurrent ? "page-item active" : "page-item"}
                            onClick={(ev) => {
                                ev.preventDefault()
                                props.onSetPage(v)
                            }}
                            key={v.toString()}
                        >
                            <a className="page-link" href="">
                                {v + 1}
                            </a>
                        </li>
                    )
                })}
            </ul>
        </nav>
    )
}
