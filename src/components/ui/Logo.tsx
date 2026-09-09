export function Logo({ size = 32 }: { size?: number }) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <img
        src={`${import.meta.env.BASE_URL}logo.png`}
        alt="Just24You"
        style={{ height: size, width: "auto" }}
        className="drop-shadow-sm"
      />
      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400">
        Just24You
      </span>
    </div>
  );
}
