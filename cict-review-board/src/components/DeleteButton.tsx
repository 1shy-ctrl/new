"use client";

export default function DeleteButton() {
  return (
    <button
      type="submit"
      className="btn-quiet text-seal-dark"
      onClick={(e) => {
        if (!confirm("Delete this upload and all of its votes? This can't be undone.")) e.preventDefault();
      }}
    >
      Delete upload
    </button>
  );
}
