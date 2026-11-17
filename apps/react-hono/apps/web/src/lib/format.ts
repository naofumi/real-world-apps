import { useEffect } from "react";

export function avatar(image: string | null | undefined): string {
  return image && image.trim() ? image : "/default-avatar.svg";
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function ordinal(day: number): string {
  const lastTwo = day % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  const month = MONTHS[date.getMonth()] ?? "";
  return `${month} ${ordinal(date.getDate())}`;
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title === "Conduit" ? title : `${title} — Conduit`;
    return () => {
      document.title = "Conduit";
    };
  }, [title]);
}
