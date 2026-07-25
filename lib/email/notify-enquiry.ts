import "server-only";
import type { EnquiryInput } from "@/lib/validation/enquiry";

// TODO(slice-8): wire to a real email provider (Resend) delivering to the
// clerking inbox. For now this logs that it *would* have sent, so the hook is
// visible in testing.
export async function notifyEnquiryReceived(enquiry: EnquiryInput & { id: string }): Promise<void> {
  console.info(
    `[enquiry] would have sent clerk notification — id=${enquiry.id} · ` +
      `${enquiry.enquirerName} <${enquiry.email}>` +
      `${enquiry.firm ? ` (${enquiry.firm})` : ""} · urgency=${enquiry.urgency} · ` +
      `caseType=${enquiry.caseType || "—"} · counsel=[${enquiry.counselIds.join(", ") || "none"}]`,
  );
}
