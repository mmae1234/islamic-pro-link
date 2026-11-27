export const ORG_TYPES = [
  { value: "mosque", label: "Mosque / Islamic center" },
  { value: "student_association", label: "Student association (MSA)" },
  { value: "professional_association", label: "Professional association" },
  { value: "nonprofit", label: "Nonprofit / charity" },
  { value: "school", label: "School" },
  { value: "other", label: "Other organization" },
] as const;

export type OrgType = (typeof ORG_TYPES)[number]["value"];

export const orgTypeLabel = (t: string | null | undefined) =>
  ORG_TYPES.find((o) => o.value === t)?.label ?? "Organization";

/** RSVP links: https only, real hostname (mirrors the database check). */
export const SAFE_HTTPS_URL =
  /^https:\/\/[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}(:[0-9]{2,5})?(\/[^\s<>"'`]*)?$/i;

export const urlHost = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};
