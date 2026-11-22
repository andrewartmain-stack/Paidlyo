import { toast } from "sonner";

/** Copies an invite link and confirms with a toast. */
export async function copyLink(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Invite link copied");
  } catch {
    toast.error("Couldn't copy. Select the link and copy it manually.");
  }
}
