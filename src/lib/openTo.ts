export const OPEN_TO = [
  { value: "hiring", label: "Hiring" },
  { value: "job_seeking", label: "Looking for work" },
  { value: "cofounding", label: "Open to cofounding" },
  { value: "freelance", label: "Freelance / consulting" },
  { value: "volunteering", label: "Volunteering" },
  { value: "speaking", label: "Speaking" },
] as const;

export const openToLabel = (v: string) => OPEN_TO.find((o) => o.value === v)?.label ?? v;
