import { Link } from "react-router-dom";

export function Pagination({
  page,
  total,
  limit,
  hrefFor,
}: {
  page: number;
  total: number;
  limit: number;
  hrefFor: (page: number) => string;
}) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  return (
    <ul className="pagination">
      {Array.from({ length: pages }, (_, index) => {
        const number = index + 1;
        return (
          <li key={number} className={`page-item${number === page ? " active" : ""}`}>
            <Link className="page-link" to={hrefFor(number)}>
              {number}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
