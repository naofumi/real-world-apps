import { Head, router, useForm } from '@inertiajs/react';
import ConduitLayout from '@/Layouts/ConduitLayout';
import ListErrors from '@/Components/ListErrors';

export default function Edit({ user }) {
    const { data, setData, put, processing, errors } = useForm({
        image: user.image || '',
        username: user.username || '',
        bio: user.bio || '',
        email: user.email || '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        put('/settings');
    };

    const logout = () => {
        router.post('/logout');
    };

    return (
        <ConduitLayout>
            <Head title="Settings" />
            <div className="settings-page">
                <div className="container page">
                    <div className="row">
                        <div className="col-md-6 offset-md-3 col-xs-12">
                            <h1 className="text-xs-center">Your Settings</h1>
                            <ListErrors errors={errors} />
                            <form onSubmit={submit}>
                                <fieldset>
                                    <fieldset className="form-group">
                                        <input
                                            className="form-control"
                                            type="text"
                                            placeholder="URL of profile picture"
                                            value={data.image}
                                            onChange={(e) => setData('image', e.target.value)}
                                        />
                                    </fieldset>
                                    <fieldset className="form-group">
                                        <input
                                            className="form-control form-control-lg"
                                            type="text"
                                            placeholder="Your Username"
                                            value={data.username}
                                            onChange={(e) => setData('username', e.target.value)}
                                        />
                                    </fieldset>
                                    <fieldset className="form-group">
                                        <textarea
                                            className="form-control form-control-lg"
                                            rows={8}
                                            placeholder="Short bio about you"
                                            value={data.bio}
                                            onChange={(e) => setData('bio', e.target.value)}
                                        />
                                    </fieldset>
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
                                            placeholder="New Password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                        />
                                    </fieldset>
                                    <fieldset className="form-group">
                                        <input
                                            className="form-control form-control-lg"
                                            type="password"
                                            placeholder="Confirm New Password"
                                            value={data.password_confirmation}
                                            onChange={(e) =>
                                                setData('password_confirmation', e.target.value)
                                            }
                                        />
                                    </fieldset>
                                    <button
                                        className="btn btn-lg btn-primary pull-xs-right"
                                        type="submit"
                                        disabled={processing}
                                    >
                                        Update Settings
                                    </button>
                                </fieldset>
                            </form>
                            <hr />
                            <button type="button" className="btn btn-outline-danger" onClick={logout}>
                                Or click here to logout.
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </ConduitLayout>
    );
}
