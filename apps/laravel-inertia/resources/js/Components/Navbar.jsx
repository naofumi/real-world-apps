import { Link, usePage } from '@inertiajs/react';

function Avatar({ user, className = 'user-pic' }) {
    if (user?.image) {
        return <img src={user.image} className={className} alt={user.username} />;
    }

    return (
        <img
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.username || 'U')}`}
            className={className}
            alt={user?.username || ''}
        />
    );
}

export default function Navbar() {
    const { auth, url } = usePage().props;
    const user = auth?.user;
    const path = typeof window !== 'undefined' ? window.location.pathname : url || '/';

    const linkClass = (href, exact = false) => {
        const active = exact ? path === href : path.startsWith(href);
        return `nav-link${active ? ' active' : ''}`;
    };

    return (
        <nav className="navbar navbar-light">
            <div className="container">
                <Link href="/" className="navbar-brand">
                    conduit
                </Link>
                <ul className="nav navbar-nav pull-xs-right">
                    <li className="nav-item">
                        <Link href="/" className={linkClass('/', true)}>
                            Home
                        </Link>
                    </li>
                    {user ? (
                        <>
                            <li className="nav-item">
                                <Link href="/editor" className={linkClass('/editor')}>
                                    <i className="ion-compose"></i>&nbsp;New Article
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/settings" className={linkClass('/settings', true)}>
                                    <i className="ion-gear-a"></i>&nbsp;Settings
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link
                                    href={`/users/${user.username}`}
                                    className={linkClass(`/users/${user.username}`)}
                                >
                                    <Avatar user={user} />
                                    {user.username}
                                </Link>
                            </li>
                        </>
                    ) : (
                        <>
                            <li className="nav-item">
                                <Link href="/login" className={linkClass('/login', true)}>
                                    Sign in
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link href="/register" className={linkClass('/register', true)}>
                                    Sign up
                                </Link>
                            </li>
                        </>
                    )}
                </ul>
            </div>
        </nav>
    );
}

export { Avatar };
