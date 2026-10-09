// Finds personal contact details in a proposal's text so the author can remove
// them before publishing. It catches emails and phone numbers; the upload
// screen also asks authors to check for addresses and student IDs by eye.

export type PiiFinding = { kind: "email" | "phone"; sample: string; page: number };

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// Digit groups separated by spaces, dots, dashes or brackets, with an optional country code.
const PHONE = /(?<![\w/])(?:\+\d{1,3}[\s.-]?)?(?:\(\d{1,5}\)[\s.-]?)?\d{2,5}(?:[\s.-]?\d{2,5}){1,4}(?![\w/])/g;
const MAX_FINDINGS = 25;

function maskEmail(value: string) {
  const [local, domain] = value.split("@");
  return `${local.slice(0, 1)}•••@${domain}`;
}

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return `•••• ${digits.slice(-3)}`;
}

/** pages: extracted text per page, in order. */
export function scanForPii(pages: string[]): PiiFinding[] {
  const findings: PiiFinding[] = [];
  const seen = new Set<string>();
  pages.forEach((text, index) => {
    for (const match of text.matchAll(EMAIL)) {
      const key = `email:${match[0].toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push({ kind: "email", sample: maskEmail(match[0]), page: index + 1 });
    }
    for (const match of text.matchAll(PHONE)) {
      const digits = match[0].replace(/\D/g, "");
      // 10 to 15 digits; shorter runs are dates, years, version numbers or counts.
      if (digits.length < 10 || digits.length > 15) continue;
      const key = `phone:${digits}`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push({ kind: "phone", sample: maskPhone(match[0]), page: index + 1 });
    }
  });
  return findings.slice(0, MAX_FINDINGS);
}
