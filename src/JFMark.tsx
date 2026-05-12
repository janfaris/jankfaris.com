/**
 * JF monogram — typographic mark for headers, footers, and section bookmarks.
 * Uses currentColor so it inherits text color from its parent.
 * The viewBox is 80×80 to give the J's descender room below the F's baseline.
 */
export function JFMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 80 80"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Jan Faris monogram"
    >
      <g fill="currentColor">
        {/* J top serif */}
        <rect x="14" y="14" width="22" height="6.5" rx="0.5" />
        {/* J vertical stem */}
        <rect x="21" y="20.5" width="8" height="34" />
        {/* J hook descender — drops below F baseline */}
        <path d="M 21 49 L 29 49 Q 29 64 17 64 Q 6 64 6 51 L 15 51 Q 15 56 17 56 Q 21 56 21 49 Z" />
        {/* F top crossbar */}
        <rect x="45" y="14" width="29" height="6.5" rx="0.5" />
        {/* F vertical stem */}
        <rect x="45" y="20.5" width="8" height="38" />
        {/* F middle crossbar */}
        <rect x="53" y="34" width="19" height="6" rx="0.5" />
      </g>
    </svg>
  )
}
