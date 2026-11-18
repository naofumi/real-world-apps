import { Head, Link, router, usePage } from '@inertiajs/react';
import ConduitLayout from '@/Layouts/ConduitLayout';
import ArticlePreview from '@/Components/ArticlePreview';
import Pagination from '@/Components/Pagination';
import { Avatar } from '@/Components/Navbar';

export default function Show({ profile, tab, articles }) {
    const { auth } = usePage().props;

    const toggleFollow = () => {
        if (!auth?.user) {
            router.visit('/login');
            return;
        }
        if (profile.following) {
            router.delete(`/users/${profile.username}/follow`);
        } else {
            router.post(`/users/${profile.username}/follow`);
        }
    };

    return (
        <ConduitLayout>
            <Head title={profile.username} />
            <div className="profile-page">
                <div className="user-info">
                    <div className="container">
                        <div className="row">
                            <div className="col-xs-12 col-md-10 offset-md-1">
                                <Avatar user={profile} className="user-img" />
                                <h4>{profile.username}</h4>
                                <p>{profile.bio}</p>
                                {profile.isSelf ? (
                                    <Link
                                        href="/settings"
                                        className="btn btn-sm btn-outline-secondary action-btn"
                                    >
                                        <i className="ion-gear-a"></i> Edit Profile Settings
                                    </Link>
                                ) : (
                                    <button
                                        type="button"
                                        className={`btn btn-sm action-btn ${
                                            profile.following
                                                ? 'btn-secondary'
                                                : 'btn-outline-secondary'
                                        }`}
                                        onClick={toggleFollow}
                                    >
                                        <i className="ion-plus-round"></i>
                                        &nbsp;{profile.following ? 'Unfollow' : 'Follow'}{' '}
                                        {profile.username}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container">
                    <div className="row">
                        <div className="col-xs-12 col-md-10 offset-md-1">
                            <div className="articles-toggle">
                                <ul className="nav nav-pills outline-active">
                                    <li className="nav-item">
                                        <Link
                                            href={`/users/${profile.username}`}
                                            className={`nav-link${tab === 'articles' ? ' active' : ''}`}
                                        >
                                            My Articles
                                        </Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link
                                            href={`/users/${profile.username}/favorites`}
                                            className={`nav-link${tab === 'favorites' ? ' active' : ''}`}
                                        >
                                            Favorited Articles
                                        </Link>
                                    </li>
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
                    </div>
                </div>
            </div>
        </ConduitLayout>
    );
}
