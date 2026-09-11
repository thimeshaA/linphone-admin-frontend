// Known types as of Phase 3 of the backend — `type` itself is a free-form
// column so new ones can appear without a frontend change; unrecognized
// values fall back to a humanized version of the raw string.
const KNOWN_TYPE_LABEL: Record<string, string> = {
  renewal_deduction: "Renewal deduction",
  invoice_issued: "Invoice issued",
  payment_recorded: "Payment recorded",
};

export function notificationTypeLabel(type: string) {
  return (
    KNOWN_TYPE_LABEL[type] ??
    type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
