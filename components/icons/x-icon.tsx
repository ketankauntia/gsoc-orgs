/**
 * X (Twitter) Icon Component
 * Reusable X logo SVG
 */
export const XIcon = ({ className = "w-5 h-5" }: { className?: string }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2H21l-6.547 7.486L22 22h-6.828l-5.352-7.01L3.72 22H1l7.014-8.016L2 2h6.828l4.848 6.34L18.244 2zM16.97 20h1.884L7.09 4H5.09l11.88 16z" />
    </svg>
  );
};
