import { apiFetch } from "./client";

export interface AccountRequestEntry {
  name: string;
  email?: string | undefined;
  phone?: string | undefined;
  note?: string | undefined;
}

// Authenticated reseller intake for provisioning requests — rides the
// reseller's existing session/cookie rather than the public unauthenticated
// /requests form. Nothing is persisted server-side, so a failed submission
// is a genuinely lost request, not a retryable draft. The backend sends a
// single email to operations listing every entry in the batch; it does not
// send the reseller a confirmation copy.
export const accountRequestsApi = {
  submitBatch: (requests: AccountRequestEntry[]) =>
    apiFetch<{ message: string }>("/accounts/request", {
      method: "POST",
      body: JSON.stringify({ requests }),
    }),
};
