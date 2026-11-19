import { Link, usePage } from '@inertiajs/react';
import Navbar from '@/Components/Navbar';

export default function ConduitLayout({ children }) {
    const { flash } = usePage().props;

    return (
        <>
            <Navbar />
            {flash?.success ? (
                <div className="container">
                    <div className="flash notice">{flash.success}</div>
                </div>
            ) : null}
            {flash?.status ? (
                <div className="container">
                    <div className="flash notice">{flash.status}</div>
                </div>
            ) : null}
            {children}
            <footer>
                <div className="container">
                    <Link href="/" className="logo-font">
                        conduit
                    </Link>
                    <span className="attribution">A place to share your knowledge.</span>
                </div>
            </footer>
        </>
    );
}
