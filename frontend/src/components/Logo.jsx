export default function Logo({ size = 28, color = '#1597a5' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7.5 3C5 3 3.5 5 3.5 7.5c0 2 .8 3.4 1.4 5.2.7 2.2.6 4.3 1.6 6.8.4 1 1.4 1.5 2.2.5.9-1.1.7-3.8 2.3-3.8s1.4 2.7 2.3 3.8c.8 1 1.8.5 2.2-.5 1-2.5.9-4.6 1.6-6.8.6-1.8 1.4-3.2 1.4-5.2C20.5 5 19 3 16.5 3c-1.8 0-2.8.8-4.5.8S9.3 3 7.5 3z" />
    </svg>
  );
}
