import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDocumentTitle } from "../../lib/format.js";
import { useRememberUser } from "../../lib/auth.js";
import { api } from "../../lib/client.js";
import { loginRedirectPath } from "../../lib/login-state.js";
import { ErrorList } from "../shell/error-list.js";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const remember = useRememberUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  useDocumentTitle("Sign in");
  const from = loginRedirectPath(location.state);
  const mutation = useMutation({
    mutationFn: () => api.login({ email, password }),
    onSuccess: ({ user }) => {
      remember(user);
      navigate(from);
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <div className="auth-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-6 offset-md-3 col-xs-12">
            <h1 className="text-xs-center">Sign in</h1>
            <p className="text-xs-center">
              <Link to="/register">Need an account?</Link>
            </p>
            <ErrorList error={mutation.error} />
            <form onSubmit={onSubmit}>
              <fieldset className="form-group">
                <input
                  className="form-control form-control-lg"
                  type="email"
                  name="email"
                  placeholder="Email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </fieldset>
              <fieldset className="form-group">
                <input
                  className="form-control form-control-lg"
                  type="password"
                  name="password"
                  placeholder="Password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </fieldset>
              <button className="btn btn-lg btn-primary pull-xs-right" type="submit" disabled={mutation.isPending}>
                Sign in
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const remember = useRememberUser();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  useDocumentTitle("Sign up");
  const mutation = useMutation({
    mutationFn: () => api.register({ username, email, password }),
    onSuccess: ({ user }) => {
      remember(user);
      navigate("/");
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <div className="auth-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-6 offset-md-3 col-xs-12">
            <h1 className="text-xs-center">Sign up</h1>
            <p className="text-xs-center">
              <Link to="/login">Have an account?</Link>
            </p>
            <ErrorList error={mutation.error} />
            <form onSubmit={onSubmit}>
              <fieldset className="form-group">
                <input
                  className="form-control form-control-lg"
                  type="text"
                  name="username"
                  placeholder="Username"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </fieldset>
              <fieldset className="form-group">
                <input
                  className="form-control form-control-lg"
                  type="email"
                  name="email"
                  placeholder="Email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </fieldset>
              <fieldset className="form-group">
                <input
                  className="form-control form-control-lg"
                  type="password"
                  name="password"
                  placeholder="Password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </fieldset>
              <button className="btn btn-lg btn-primary pull-xs-right" type="submit" disabled={mutation.isPending}>
                Sign up
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
