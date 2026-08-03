export default function AttestlyLogo({ className = "w-8 h-8", size = 32 }: { className?: string; size?: number }) {
  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`}
      style={{ width: `${size}px`, height: `${size}px`, minWidth: `${size}px`, minHeight: `${size}px`, maxWidth: `${size}px`, maxHeight: `${size}px` }}
    >
      {/* User provided logo image with transparent background blending */}
      <img
        src="/logo.png"
        alt="ATTESTLY Logo"
        width={size}
        height={size}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
        className="object-contain filter drop-shadow-[0_0_10px_rgba(13,148,136,0.5)] transition-all duration-300"
      />
    </div>
  );
}
