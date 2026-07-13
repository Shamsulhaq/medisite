import { getSettings } from "@/lib/store";
import { DEFAULT_PRESCRIPTION_LAYOUT } from "@/lib/prescription-layout";
import PrescriptionLayoutDesigner from "@/components/admin/PrescriptionLayoutDesigner";
import { PageHeader } from "@/components/admin/ui";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Prescription Design", robots: { index: false, follow: false } };

export default async function PrescriptionDesignPage() {
  const settings = await getSettings();
  const layout = settings.prescriptionLayout || DEFAULT_PRESCRIPTION_LAYOUT;

  // Fetch a real consultation for preview (latest non-superseded)
  const sampleConsultation = await prisma.consultation.findFirst({
    where: { superseded: false },
    orderBy: { createdAt: "desc" },
    include: { patient: true },
  });

  const sampleData = sampleConsultation ? {
    patient: {
      name: sampleConsultation.patient.name,
      age: sampleConsultation.patient.age,
      gender: sampleConsultation.patient.gender,
      phone: sampleConsultation.patient.phone,
      patientId: sampleConsultation.patient.patientId,
    },
    consultation: {
      date: sampleConsultation.date,
      chiefComplaint: sampleConsultation.chiefComplaint,
      diagnosis: sampleConsultation.diagnosis,
      medicines: sampleConsultation.medicines as { name: string; form: string; dosage: string; frequency?: string; timing?: string; duration?: string }[],
      advices: sampleConsultation.advices,
      investigations: sampleConsultation.investigations,
      followUp: sampleConsultation.followUp,
      vitals: {
        bp: sampleConsultation.vitalsBp,
        pulse: sampleConsultation.vitalsPulse,
        weight: sampleConsultation.vitalsWeight,
        spo2: sampleConsultation.vitalsSpo2,
        temp: sampleConsultation.vitalsTemp,
      },
    },
  } : null;

  return (
    <div>
      <PageHeader
        title="Prescription Design"
        description="Customize your printed prescription layout — header, footer, columns, watermark, logo, and page settings."
      />
      <PrescriptionLayoutDesigner initial={layout} settings={settings} sampleData={sampleData} />
    </div>
  );
}
