import { Head, Link, useForm } from '@inertiajs/react';
import ConduitLayout from '@/Layouts/ConduitLayout';
import ListErrors from '@/Components/ListErrors';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <ConduitLayout>
            <Head title="Sign in" />
            <div className="auth-page">
                <div className="container page">
                    <div className="row">
                        <div className="col-md-6 offset-md-3 col-xs-12">
                            <h1 className="text-xs-center">Sign in</h1>
                            <p className="text-xs-center">
                                <Link href="/register">Need an account?</Link>
                            </p>
                            {status ? <p className="text-xs-center">{status}</p> : null}
                            <ListErrors errors={errors} />
                            <form onSubmit={submit}>
                                <fieldset className="form-group">
                                    <input
                                        className="form-control form-control-lg"
                                        type="email"
                                        placeholder="Email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                    />
                                </fieldset>
                                <fieldset className="form-group">
                                    <input
                                        className="form-control form-control-lg"
                                        type="password"
                                        placeholder="Password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                    />
                                </fieldset>
                                {canResetPassword ? (
                                    <p className="text-xs-center">
                                        <Link href="/forgot-password">Forgot your password?</Link>
                                    </p>
                                ) : null}
                                <button
                                    className="btn btn-lg btn-primary pull-xs-right"
                                    type="submit"
                                    disabled={processing}
                                >
                                    Sign in
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </ConduitLayout>
    );
}
