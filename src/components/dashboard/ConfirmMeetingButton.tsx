"use client";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { EngagementCharter } from "@/components/forms/EngagementCharter";
import { confirmMeeting } from "@/app/[locale]/dashboard/client/actions";

// « Confirmer le rendez-vous » ouvre la charte ; l'accepter confirme le RDV,
// ce qui révèle l'identité de l'architecte.
export function ConfirmMeetingButton({ meetingId, architectHandle }: { meetingId: string; architectHandle: string }) {
  const t = useTranslations("dashboardClient");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="px-4 py-2 bg-ink text-paper text-sm">
        {t("meetings.confirm")}
      </button>
      {open && (
        <EngagementCharter
          architectHandle={architectHandle}
          onClose={close}
          onAccept={async () => {
            const res = await confirmMeeting(meetingId);
            return "error" in res ? { error: t(`errors.${res.error}` as "errors.generic") } : res;
          }}
          onAccepted={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
