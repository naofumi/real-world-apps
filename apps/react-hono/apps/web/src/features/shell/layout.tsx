import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useCurrentUser } from "../../lib/auth.js";
import { avatar } from "../../lib/format.js";

export function Layout() {
  const me = useCurrentUser();
  const location = useLocation();
  const user = me.data;
  const homeActive = location.pathname === "/" || location.pathname.startsWith("/tag/");

  return (
    <>
      <nav className="navbar navbar-light">
        <div className="container">
          <Link className="navbar-brand" to="/">
            conduit
          </Link>
          <ul className="nav navbar-nav pull-xs-right">
            <li className="nav-item">
              <Link className={`nav-link${homeActive ? " active" : ""}`} to="/">
                Home
              </Link>
            </li>
            {user ? (
              <>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/editor">
                    <i className="ion-compose" />
                    &nbsp;New Article
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/settings">
                    <i className="ion-gear-a" />
                    &nbsp;Settings
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
                    to={`/profile/${encodeURIComponent(user.username)}`}
                  >
                    <img className="user-pic" src={avatar(user.image)} alt="" />
                    {user.username}
                  </NavLink>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/login">
                    Sign in
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link nav-signup${isActive ? " active" : ""}`} to="/register">
                    Sign up
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </nav>
      <Outlet />
      <footer>
        <div className="container">
          <Link className="logo-font" to="/">
            conduit
          </Link>
          <span className="attribution">
            An interactive learning project from <a href="https://thinkster.io">Thinkster</a>. Code &amp; design licensed under MIT.
          </span>
        </div>
      </footer>
    </>
  );
}
