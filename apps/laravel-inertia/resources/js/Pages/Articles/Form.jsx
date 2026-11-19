import { Head, useForm } from '@inertiajs/react';
import ConduitLayout from '@/Layouts/ConduitLayout';
import ListErrors from '@/Components/ListErrors';

export default function Form({ article }) {
    const editing = Boolean(article?.slug);
    const { data, setData, post, put, processing, errors } = useForm({
        title: article?.title || '',
        description: article?.description || '',
        body: article?.body || '',
        tagList: article?.tagList || '',
    });

    const submit = (e) => {
        e.preventDefault();
        if (editing) {
            put(`/articles/${article.slug}`);
        } else {
            post('/articles');
        }
    };

    return (
        <ConduitLayout>
            <Head title={editing ? 'Edit Article' : 'New Article'} />
            <div className="editor-page">
                <div className="container page">
                    <div className="row">
                        <div className="col-md-10 offset-md-1 col-xs-12">
                            <ListErrors errors={errors} />
                            <form onSubmit={submit}>
                                <fieldset>
                                    <fieldset className="form-group">
                                        <input
                                            type="text"
                                            className="form-control form-control-lg"
                                            placeholder="Article Title"
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                        />
                                    </fieldset>
                                    <fieldset className="form-group">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="What's this article about?"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                        />
                                    </fieldset>
                                    <fieldset className="form-group">
                                        <textarea
                                            className="form-control"
                                            rows={8}
                                            placeholder="Write your article (in markdown)"
                                            value={data.body}
                                            onChange={(e) => setData('body', e.target.value)}
                                        />
                                    </fieldset>
                                    <fieldset className="form-group">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Enter tags"
                                            value={data.tagList}
                                            onChange={(e) => setData('tagList', e.target.value)}
                                        />
                                    </fieldset>
                                    <button
                                        className="btn btn-lg pull-xs-right btn-primary"
                                        type="submit"
                                        disabled={processing}
                                    >
                                        Publish Article
                                    </button>
                                </fieldset>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </ConduitLayout>
    );
}
