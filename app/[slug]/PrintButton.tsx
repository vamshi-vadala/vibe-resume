"use client";

// "Download PDF" for a public profile. Recruiters need a FILE for their ATS;
// the browser's native print-to-PDF gives them one with zero new deps and zero
// server storage. The page's print stylesheet (globals.css @media print) hides
// all chrome so the saved PDF is just the resume.
export default function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="print-hide" data-print-button>
      ↓ Download PDF
    </button>
  );
}
