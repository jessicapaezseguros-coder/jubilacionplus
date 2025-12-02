import "./WhatsAppButton.css";

export default function WhatsAppButton({ text }: { text: string }) {
  return (
    <a
      href="https://wa.me/59897113110"
      target="_blank"
      rel="noopener noreferrer"
      className="wa-btn"
    >
      {text}
    </a>
  );
}
