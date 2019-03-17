import * as React from "react"
import * as _ from "lodash"
import { ERTSComponent } from "../ERTS/ERTS-React"
import { ApiArticles, MultiArticlesResponse, ArticleWithMeta } from "../api"
import { ifReachable } from "../ERTS/ERTS-SafeHelpers"
import ArticlePreview from "./ArticlePreview"
import { ListPagination } from "./ListPagination"

type SourceAll = { type: "all" }
type SourceFeed = { type: "feed" }
type SourceAuthor = { type: "author"; author: string }
type SourceFavorites = { type: "favorites"; author: string }
type SourceTag = { type: "tag"; tag: string }
type Source = SourceAll | SourceFeed | SourceAuthor | SourceFavorites | SourceTag
type Props = {
    source: Source
}

type StateLoading = { type: "Loading"; pageNumber: number }
type StateErrorLoading = { type: "ErrorLoading" }
type StateNoArticles = { type: "NoArticles" }
type StatePreviewArticles = {
    type: "PreviewArticles"
    articles: ArticleWithMeta[]
    articlesCount: number
    currentPage: number
}
type State = StateLoading | StateErrorLoading | StateNoArticles | StatePreviewArticles

export default class ArticleList extends ERTSComponent<Props, State> {
    isArticleLoadCanceled = false

    constructor(props: Props) {
        super(props)
        this.state = { type: "Loading", pageNumber: 0 }
    }

    componentDidMount(): void {
        this.loadPage(0)
    }

    componentWillUnmount(): void {
        this.isArticleLoadCanceled = true
    }

    loadPage(pageNumber: number): void {
        this.setState({ type: "Loading", pageNumber })

        const requestArticles: Promise<MultiArticlesResponse> = (() => {
            switch (this.props.source.type) {
                case "all":
                    return ApiArticles.getAll(pageNumber)
                case "feed":
                    return ApiArticles.getFeed(pageNumber)
                case "tag":
                    return ApiArticles.getByTag(this.props.source.tag, pageNumber)
                case "author":
                    return ApiArticles.getByAuthor(this.props.source.author, pageNumber)
                case "favorites":
                    return ApiArticles.getFavoritedBy(this.props.source.author, pageNumber)
                default:
                    throw ifReachable(this.props.source)
            }
        })()

        this.isArticleLoadCanceled = false

        requestArticles
            .then((articlesResp) => {
                if (this.isArticleLoadCanceled) return

                if (articlesResp.articlesCount === 0) {
                    this.setState({ type: "NoArticles" })
                    return
                }

                this.setState({
                    type: "PreviewArticles",
                    articles: articlesResp.articles,
                    articlesCount: articlesResp.articlesCount,
                    currentPage: pageNumber,
                })
            })

            .catch(() => {
                if (this.isArticleLoadCanceled) return

                this.setState({ type: "ErrorLoading" })
            })
    }

    render(): JSX.Element {
        switch (this.state.type) {
            case "Loading":
                return <div className="article-preview">Loading...</div>
            case "ErrorLoading":
                return <div className="article-preview">(Articles not available right now...)</div>
            case "NoArticles":
                return <div className="article-preview">No articles are here... yet.</div>
            case "PreviewArticles":
                return this.renderArticlePreviews(this.state)
            default:
                throw ifReachable(this.state)
        }
    }

    renderArticlePreviews({
        articles,
        articlesCount,
        currentPage,
    }: StatePreviewArticles): JSX.Element {
        return (
            <div>
                {articles.map((article) => (
                    <ArticlePreview article={article} key={article.slug} />
                ))}

                <ListPagination
                    onSetPage={(page) => this.loadPage(page)}
                    articlesCount={articlesCount}
                    currentPage={currentPage}
                />
            </div>
        )
    }
}
