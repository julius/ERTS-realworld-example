import * as React from "react"
import { ERTSComponent } from "../ERTS/ERTS-React"
import { Article, ArticleWithMeta, ApiArticles } from "../api"
import { Link } from "react-router-dom"
import { eventAddNotification } from "../SharedData/eventAddNotification"

const FAVORITED_CLASS = "btn btn-sm btn-primary"
const NOT_FAVORITED_CLASS = "btn btn-sm btn-outline-primary"

interface Props {
    article: ArticleWithMeta
}

interface State {
    favorited: boolean
    favoritesCount: number
}

export default class ArticlePreview extends ERTSComponent<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {
            favorited: props.article.favorited,
            favoritesCount: props.article.favoritesCount,
        }
    }

    favorite(slug: string): void {
        ApiArticles.postFavorite(slug)

            .then(() => {
                this.setState({
                    favorited: true,
                    favoritesCount: this.state.favoritesCount + 1,
                })
            })

            .catch((err) => {
                console.error("Favorite failed.", err)
                eventAddNotification.trigger("Favorite failed.")
            })
    }

    unfavorite(slug: string): void {
        ApiArticles.deleteFavorite(slug)

            .then(() => {
                this.setState({
                    favorited: false,
                    favoritesCount: this.state.favoritesCount - 1,
                })
            })

            .catch((err) => {
                console.error("Unfavorite failed.", err)
                eventAddNotification.trigger("Unfavorite failed.")
            })
    }

    render(): JSX.Element {
        const { article } = this.props

        return (
            <div className="article-preview">
                <div className="article-meta">
                    <Link to={`/@${article.author.username}`}>
                        {article.author.image !== null ? (
                            <img src={article.author.image} alt={article.author.username} />
                        ) : (
                            article.author.username
                        )}
                    </Link>

                    <div className="info">
                        <Link className="author" to={`/@${article.author.username}`}>
                            {article.author.username}
                        </Link>
                        <span className="date">{new Date(article.createdAt).toDateString()}</span>
                    </div>

                    <div className="pull-xs-right">
                        <button
                            className={this.state.favorited ? FAVORITED_CLASS : NOT_FAVORITED_CLASS}
                            onClick={(ev) => {
                                ev.preventDefault()
                                if (this.state.favorited) {
                                    this.unfavorite(article.slug)
                                } else {
                                    this.favorite(article.slug)
                                }
                            }}
                        >
                            <i className="ion-heart" /> {this.state.favoritesCount}
                        </button>
                    </div>
                </div>

                <Link to={`/article/${article.slug}`} className="preview-link">
                    <h1>{article.title}</h1>
                    <p>{article.description}</p>
                    <span>Read more...</span>
                    <ul className="tag-list">
                        {article.tagList.map((tag) => {
                            return (
                                <li className="tag-default tag-pill tag-outline" key={tag}>
                                    {tag}
                                </li>
                            )
                        })}
                    </ul>
                </Link>
            </div>
        )
    }
}
