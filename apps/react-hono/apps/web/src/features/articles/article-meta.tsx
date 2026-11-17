import type { Profile } from "@conduit/contracts";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { avatar, formatDate } from "../../lib/format.js";

export function ArticleMeta({
  author,
  date,
  children,
}: {
  author: Profile;
  date: string;
  children?: ReactNode;
}) {
  return (
    <div className="article-meta">
      <Link to={`/profile/${encodeURIComponent(author.username)}`}>
        <img src={avatar(author.image)} alt="" />
      </Link>
      <div className="info">
        <Link className="author" to={`/profile/${encodeURIComponent(author.username)}`}>
          {author.username}
        </Link>
        <span className="date">{formatDate(date)}</span>
      </div>
      {children}
    </div>
  );
}
