import { Link, router } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { Avatar } from '@/Components/Navbar';

function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

export default function ArticlePreview({ article }) {
    const { auth } = usePage().props;

    const toggleFavorite = (e) => {
        e.preventDefault();
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
        <div className="article-preview">
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
                <div className="favorite favorite--compact pull-xs-right">
                    <button
                        type="button"
                        className={`btn btn-sm ${article.favorited ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={toggleFavorite}
                    >
                        <i className="ion-heart"></i> {article.favoritesCount}
                    </button>
                </div>
            </div>
            <Link href={`/articles/${article.slug}`} className="preview-link">
                <h1>{article.title}</h1>
                <p>{article.description}</p>
                <span>Read more...</span>
                <ul className="tag-list">
                    {article.tagList.map((tag) => (
                        <li key={tag} className="tag-default tag-pill tag-outline">
                            {tag}
                        </li>
                    ))}
                </ul>
            </Link>
        </div>
    );
}
