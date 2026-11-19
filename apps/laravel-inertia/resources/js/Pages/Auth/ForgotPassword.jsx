import { Head, useForm } from '@inertiajs/react';
import ConduitLayout from '@/Layouts/ConduitLayout';
import ListErrors from '@/Components/ListErrors';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    const submit = (e) => {
        e.preventDefault();
        post('/forgot-password');
    };

    return (
        <ConduitLayout>
            <Head title="Forgot password" />
            <div className="auth-page">
                <div className="container page">
                    <div className="row">
                        <div className="col-md-6 offset-md-3 col-xs-12">
                            <h1 className="text-xs-center">Forgot password</h1>
                            <p className="text-xs-center">
                                Enter your email and we will send a reset link.
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
                                <button
                                    className="btn btn-lg btn-primary pull-xs-right"
                                    type="submit"
                                    disabled={processing}
                                >
                                    Send reset link
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </ConduitLayout>
    );
}
