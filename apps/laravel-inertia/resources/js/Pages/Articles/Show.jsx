import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import ConduitLayout from '@/Layouts/ConduitLayout';
import { Avatar } from '@/Components/Navbar';
import ListErrors from '@/Components/ListErrors';

function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

function ArticleMeta({ article }) {
    const { auth } = usePage().props;

    const toggleFavorite = () => {
        if (!auth?.user) {
            router.visit('/login');
            return;
        }
        if (article.favorited) {
            router.delete(`/articles/${article.slug}/favorite`);
        } else {
            router.post(`/articles/${article.slug}/favorite`);
        }
    };

    return (
        <div className="article-meta">
            <Link href={`/users/${article.author.username}`}>
                <Avatar user={article.author} />
            </Link>
            <div className="info">
                <Link href={`/users/${article.author.username}`} className="author">
                    {article.author.username}
                </Link>
                <span className="date">{formatDate(article.createdAt)}</span>
            </div>
            {article.canEdit ? (
                <>
                    <Link
                        href={`/editor/${article.slug}`}
                        className="btn btn-outline-secondary btn-sm"
                    >
                        <i className="ion-edit"></i> Edit Article
                    </Link>
                    &nbsp;
                    <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => {
                            if (confirm('Delete this article?')) {
                                router.delete(`/articles/${article.slug}`);
                            }
                        }}
                    >
                        <i className="ion-trash-a"></i> Delete Article
                    </button>
                </>
            ) : (
                <button
                    type="button"
                    className={`btn btn-sm ${article.favorited ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={toggleFavorite}
                >
                    <i className="ion-heart"></i>
                    &nbsp;{article.favorited ? 'Unfavorite' : 'Favorite'} Article ({
                        article.favoritesCount
                    })
                </button>
            )}
        </div>
    );
}

export default function Show({ article, comments }) {
    const { auth } = usePage().props;
    const { data, setData, post, processing, errors, reset } = useForm({ body: '' });

    const submitComment = (e) => {
        e.preventDefault();
        post(`/articles/${article.slug}/comments`, {
            preserveScroll: true,
            onSuccess: () => reset('body'),
        });
    };

    return (
        <ConduitLayout>
            <Head title={article.title} />
            <div className="article-page">
                <div className="banner">
                    <div className="container">
                        <h1>{article.title}</h1>
                        <ArticleMeta article={article} />
                    </div>
                </div>

                <div className="container page">
                    <div className="row article-content">
                        <div className="col-md-12">
                            <div dangerouslySetInnerHTML={{ __html: article.bodyHtml }} />
                            <ul className="tag-list">
                                {article.tagList.map((tag) => (
                                    <li key={tag} className="tag-default tag-pill tag-outline">
                                        <Link href={`/?tag=${encodeURIComponent(tag)}`}>{tag}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <hr />

                    <div className="article-actions">
                        <ArticleMeta article={article} />
                    </div>

                    <div className="row">
                        <div className="col-xs-12 col-md-8 offset-md-2">
                            {auth?.user ? (
                                <form className="card comment-form" onSubmit={submitComment}>
                                    <ListErrors errors={errors} />
                                    <div className="card-block">
                                        <textarea
                                            className="form-control"
                                            rows={3}
                                            placeholder="Write a comment..."
                                            value={data.body}
                                            onChange={(e) => setData('body', e.target.value)}
                                        />
                                    </div>
                                    <div className="card-footer">
                                        <Avatar user={auth.user} className="comment-author-img" />
                                        <button
                                            type="submit"
                                            className="btn btn-sm btn-primary"
                                            disabled={processing}
                                        >
                                            Post Comment
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <p>
                                    <Link href="/login">Sign in</Link> or <Link href="/register">sign up</Link> to
                                    add comments on this article.
                                </p>
                            )}

                            {comments.map((comment) => (
                                <div key={comment.id} className="card">
                                    <div className="card-block">
                                        <p className="card-text">{comment.body}</p>
                                    </div>
                                    <div className="card-footer">
                                        <Link
                                            href={`/users/${comment.author.username}`}
                                            className="comment-author"
                                        >
                                            <Avatar user={comment.author} className="comment-author-img" />
                                        </Link>
                                        &nbsp;
                                        <Link
                                            href={`/users/${comment.author.username}`}
                                            className="comment-author"
                                        >
                                            {comment.author.username}
                                        </Link>
                                        <span className="date-posted">{formatDate(comment.createdAt)}</span>
                                        {comment.canDelete ? (
                                            <span className="mod-options">
                                                <i
                                                    className="ion-trash-a"
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() =>
                                                        router.delete(
                                                            `/articles/${article.slug}/comments/${comment.id}`,
                                                        )
                                                    }
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            router.delete(
                                                                `/articles/${article.slug}/comments/${comment.id}`,
                                                            );
                                                        }
                                                    }}
                                                ></i>
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </ConduitLayout>
    );
}
