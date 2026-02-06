export default function CtaButton({
  label,
  helper
}: {
  label: string;
  helper: string;
}) {
  return (
    <button className="cta-button" type="button">
      <span>{label}</span>
      <span className="cta-helper">{helper}</span>
    </button>
  );
}
