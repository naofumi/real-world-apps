import { Link } from '@inertiajs/react';

export default function TagList({ tags, current }) {
    if (!tags?.length) {
        return (
            <div className="sidebar">
                <p>Popular Tags</p>
                <div className="tag-list">
                    <span className="empty-feed-message">No tags yet.</span>
                </div>
            </div>
        );
    }

    return (
        <div className="sidebar">
            <p>Popular Tags</p>
            <div className="tag-list">
                {tags.map((tag) => (
                    <Link
                        key={tag}
                        href={`/?tag=${encodeURIComponent(tag)}`}
                        className={`tag-default tag-pill${current === tag ? ' tag-outline' : ''}`}
                    >
                        {tag}
                    </Link>
                ))}
            </div>
        </div>
    );
}
