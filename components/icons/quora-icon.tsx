/**
 * Quora Icon Component
 * Reusable Quora icon SVG
 */
export const QuoraIcon = ({
  className = "w-5 h-5",
}: {
  className?: string;
}) => {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 0C5.371 0 0 5.371 0 12c0 6.021 4.435 11.005 10.208 11.853.765.77 2.202 2.07 4.032 2.07 1.425 0 2.51-.434 3.76-1.288l-1.664-1.664c-.637.256-1.153.34-1.76.34-.92 0-1.67-.22-2.295-.68C17.353 20.87 20 16.737 20 12c0-6.629-5.371-12-12-12zm0 19.2c-3.976 0-7.2-3.224-7.2-7.2s3.224-7.2 7.2-7.2 7.2 3.224 7.2 7.2-3.224 7.2-7.2 7.2z" />
    </svg>
  );
};
