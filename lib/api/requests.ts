import { apiFetch } from "./client";
import type { ModuleKey, RequestKind } from "@/lib/telephony/types";

export interface SubmitRequestInput {
  kind: RequestKind;
  module: ModuleKey;
  name: string;
  email: string;
  phone: string;
  company?: string | undefined;
  country?: string | undefined;
  website?: string | undefined;
  reason?: string | undefined;
  note?: string | undefined;
}

// Public intake — no session, nothing persisted server-side. The backend
// only ever confirms receipt; there's no ticket id to surface here.
export const requestsApi = {
  submit: (input: SubmitRequestInput) =>
    apiFetch<{ message: string }>("/requests", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
