import { useMutation } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { useCurrentUser, useLogout, useRememberUser } from "../../lib/auth.js";
import { api } from "../../lib/client.js";
import { useDocumentTitle } from "../../lib/format.js";
import { ErrorList } from "../shell/error-list.js";

export function SettingsPage() {
  const me = useCurrentUser();
  const remember = useRememberUser();
  const logout = useLogout();
  const user = me.data;
  const [image, setImage] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  useDocumentTitle("Settings");

  useEffect(() => {
    if (!user) return;
    setImage(user.image ?? "");
    setUsername(user.username);
    setBio(user.bio ?? "");
    setEmail(user.email);
  }, [user]);

  const mutation = useMutation({
    mutationFn: () =>
      api.updateUser({
        image,
        username,
        bio,
        email,
        ...(password ? { password } : {}),
      }),
    onSuccess: ({ user: updated }) => {
      remember(updated);
      setPassword("");
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <div className="settings-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-6 offset-md-3 col-xs-12">
            <h1 className="text-xs-center">Your Settings</h1>
            <ErrorList error={mutation.error} />
            <form onSubmit={onSubmit}>
              <fieldset>
                <fieldset className="form-group">
                  <input
                    className="form-control"
                    type="text"
                    name="image"
                    placeholder="URL of profile picture"
                    value={image}
                    onChange={(event) => setImage(event.target.value)}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <textarea
                    className="form-control form-control-lg"
                    name="bio"
                    rows={8}
                    placeholder="Short bio about you"
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="password"
                    name="password"
                    placeholder="New Password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </fieldset>
                <button className="btn btn-lg btn-primary pull-xs-right" type="submit" disabled={mutation.isPending}>
                  Update Settings
                </button>
              </fieldset>
            </form>
            <hr />
            <button
              className="btn btn-outline-danger"
              type="button"
              onClick={() => logout()}
            >
              Or click here to logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
