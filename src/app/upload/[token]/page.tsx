import prisma from "@/lib/db";
import MobileUploadClient from "./MobileUploadClient";

export const dynamic = "force-dynamic";

export default async function MobileUploadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const uploadSession = await prisma.uploadSession.findUnique({
    where: { token },
  });

  // Check validity
  const isExpired = !uploadSession || new Date() > uploadSession.expiresAt || uploadSession.status !== "waiting";

  if (isExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-sm rounded-xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Upload Link Expired</h1>
          <p className="mt-2 text-sm text-slate-500">
            This upload link has expired or is no longer valid. Please ask the clinic to generate a new QR code.
          </p>
        </div>
      </div>
    );
  }

  // Get patient name
  const patient = await prisma.patient.findUnique({
    where: { id: uploadSession.patientId },
    select: { name: true },
  });

  return <MobileUploadClient token={token} patientName={patient?.name ?? "Patient"} />;
}
