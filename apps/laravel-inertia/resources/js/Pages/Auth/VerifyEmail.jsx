import { Head, Link, router } from '@inertiajs/react';
import ConduitLayout from '@/Layouts/ConduitLayout';

export default function VerifyEmail({ status }) {
    return (
        <ConduitLayout>
            <Head title="Verify email" />
            <div className="auth-page">
                <div className="container page">
                    <div className="row">
                        <div className="col-md-6 offset-md-3 col-xs-12">
                            <h1 className="text-xs-center">Verify email</h1>
                            <p className="text-xs-center">
                                Thanks for signing up. Please verify your email if required.
                            </p>
                            {status === 'verification-link-sent' ? (
                                <p className="text-xs-center">A new verification link has been sent.</p>
                            ) : null}
                            <p className="text-xs-center">
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => router.post('/email/verification-notification')}
                                >
                                    Resend verification email
                                </button>
                            </p>
                            <p className="text-xs-center">
                                <Link href="/">Back home</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </ConduitLayout>
    );
}
