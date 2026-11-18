import { Link } from '@inertiajs/react';

export default function Pagination({ meta, links }) {
    if (!meta || meta.lastPage <= 1) {
        return null;
    }

    const pages = Array.from({ length: meta.lastPage }, (_, i) => i + 1);

    return (
        <nav>
            <ul className="pagination">
                {pages.map((page) => {
                    const href = links.pages?.[page] || null;
                    const active = page === meta.currentPage;

                    return (
                        <li key={page} className={`page-item${active ? ' active' : ''}`}>
                            {active || !href ? (
                                <span className="page-link">{page}</span>
                            ) : (
                                <Link className="page-link" href={href}>
                                    {page}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
