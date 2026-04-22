import { Link } from "wouter";
import { Fragment, ReactNode } from "react";

/**
 * Renders text with @mentions and #hashtags as clickable links.
 * - @username -> /profile/username (we use it as a search hint via /explore?q=)
 * - #tag -> /tag/tag
 */
export function renderRich(text: string): ReactNode {
  if (!text) return null;
  const parts: ReactNode[] = [];
  const re = /(@[a-zA-Z0-9_.]+|#[A-Za-z0-9_\u00C0-\uFFFF]+|https?:\/\/[^\s]+)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(<Fragment key={`t-${key++}`}>{text.slice(last, match.index)}</Fragment>);
    const token = match[0];
    if (token.startsWith("@")) {
      const handle = token.slice(1);
      parts.push(<Link key={`m-${key++}`} href={`/explore?q=${encodeURIComponent(handle)}`}><span className="text-primary hover:underline cursor-pointer">{token}</span></Link>);
    } else if (token.startsWith("#")) {
      const tag = token.slice(1);
      parts.push(<Link key={`h-${key++}`} href={`/tag/${encodeURIComponent(tag)}`}><span className="text-primary hover:underline cursor-pointer">{token}</span></Link>);
    } else {
      parts.push(<a key={`u-${key++}`} href={token} target="_blank" rel="noreferrer" className="text-primary hover:underline">{token}</a>);
    }
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(<Fragment key={`t-${key++}`}>{text.slice(last)}</Fragment>);
  return <>{parts}</>;
}

export function extractHashtags(text: string): string[] {
  const re = /#([A-Za-z0-9_\u00C0-\uFFFF]+)/g;
  const set = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) set.add(m[1]);
  return Array.from(set);
}
