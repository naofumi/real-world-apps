import { Head, Link, usePage } from '@inertiajs/react';
import ConduitLayout from '@/Layouts/ConduitLayout';
import ArticlePreview from '@/Components/ArticlePreview';
import Pagination from '@/Components/Pagination';
import TagList from '@/Components/TagList';

export default function Index({ mode, tag, tags, articles }) {
    const { auth } = usePage().props;

    return (
        <ConduitLayout>
            <Head title={tag ? `#${tag}` : mode === 'feed' ? 'Your Feed' : 'Home'} />
            <div className="home-page">
                <div className="banner">
                    <div className="container">
                        <h1 className="logo-font">conduit</h1>
                        <p>A place to share your knowledge.</p>
                    </div>
                </div>

                <div className="container page">
                    <div className="row">
                        <div className="col-md-9">
                            <div className="feed-toggle">
                                <ul className="nav nav-pills outline-active">
                                    {auth?.user ? (
                                        <li className="nav-item">
                                            <Link
                                                href="/feed"
                                                className={`nav-link${mode === 'feed' ? ' active' : ''}`}
                                            >
                                                Your Feed
                                            </Link>
                                        </li>
                                    ) : null}
                                    <li className="nav-item">
                                        <Link
                                            href="/"
                                            className={`nav-link${mode === 'global' ? ' active' : ''}`}
                                        >
                                            Global Feed
                                        </Link>
                                    </li>
                                    {tag ? (
                                        <li className="nav-item">
                                            <Link href={`/?tag=${encodeURIComponent(tag)}`} className="nav-link active">
                                                <i className="ion-pound"></i> {tag}
                                            </Link>
                                        </li>
                                    ) : null}
                                </ul>
                            </div>

                            {articles.data.length === 0 ? (
                                <div className="article-preview">
                                    <p className="empty-feed-message">No articles are here... yet.</p>
                                </div>
                            ) : (
                                articles.data.map((article) => (
                                    <ArticlePreview key={article.slug} article={article} />
                                ))
                            )}

                            <Pagination meta={articles.meta} links={articles.links} />
                        </div>
                        <div className="col-md-3">
                            <TagList tags={tags} current={tag} />
                        </div>
                    </div>
                </div>
            </div>
        </ConduitLayout>
    );
}
