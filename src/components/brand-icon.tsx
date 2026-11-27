export function BrandIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M14.5 3.5V9.4C13.6 8.5 12.2 8 10.6 8C6.9 8 4 10.9 4 14.5C4 18.1 6.9 21 10.6 21C12.3 21 13.7 20.4 14.7 19.3V20.5H19V3.5H14.5ZM11.5 17.2C9.7 17.2 8.4 16 8.4 14.5C8.4 13 9.7 11.8 11.5 11.8C13.3 11.8 14.6 13 14.6 14.5C14.6 16 13.3 17.2 11.5 17.2Z"
        fill="currentColor"
      />
    </svg>
  );
}
