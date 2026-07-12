// @ts-nocheck
// -----------------------------------------------------------------------------
// Demo Data Seed Script
// Run: npx tsx scripts/seed-demo-data.ts
// Creates: 10 blog posts, 50 patients with consultations, 30 today + 105 future appointments
// -----------------------------------------------------------------------------

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function randomFrom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randomBetween(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
function dateStr(daysFromNow: number): string {
  const d = new Date(); d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split("T")[0];
}
const today = dateStr(0);

// ---- NAMES & DATA ----
const maleNames = ["Rahim Uddin", "Karim Hossain", "Jamal Ahmed", "Faruk Islam", "Hafiz Rahman", "Nasir Uddin", "Belal Hossain", "Sumon Mia", "Rashed Khan", "Imran Ali", "Shakil Ahmed", "Masud Rana", "Zahid Hassan", "Monir Hossain", "Rafiq Islam", "Sohel Rana", "Liton Mia", "Babul Hossain", "Manik Chandra", "Alamgir Kabir", "Shafiq Ahmed", "Mizanur Rahman", "Abul Kalam", "Mojibur Rahman", "Shahidul Islam"];
const femaleNames = ["Fatema Begum", "Rashida Khatun", "Salma Akter", "Nasima Begum", "Rahima Khatun", "Hasina Akter", "Amina Begum", "Kulsum Akter", "Roksana Begum", "Shahida Khatun", "Momena Begum", "Josna Akter", "Taslima Begum", "Lovely Akter", "Rumi Khatun", "Shirin Akter", "Parvin Begum", "Mousumi Akter", "Jharna Begum", "Sathi Akter", "Nargis Begum", "Shilpi Akter", "Rina Begum", "Beauty Akter", "Dalia Begum"];
const addresses = ["Faridpur Sadar", "Bhanga", "Boalmari", "Nagarkanda", "Sadarpur", "Alfadanga", "Madhukhali", "Charbhadrasan", "Saltha"];
const complaints = ["Fever & cough", "Headache & dizziness", "Chest pain", "Breathing difficulty", "Abdominal pain", "Joint pain", "Skin rash", "Back pain", "Weakness & fatigue", "Sore throat", "Diarrhea", "Vomiting", "Urinary problems", "Eye irritation", "Ear pain"];
const diagnoses = ["B. Asthma", "GERD", "HTN", "Type 2 DM", "UTI", "Acute Pharyngitis", "Viral Fever", "Peptic Ulcer", "Osteoarthritis", "Allergic Rhinitis", "Sinusitis", "IBS", "Migraine", "Anemia", "Hyperlipidemia"];
const medicines = [
  { name: "Napa", generic: "Paracetamol", form: "Tablet", dosage: "500 mg", frequency: "১+০+১ (সকাল-রাত)", timing: "খাওয়ার পরে", duration: "৫ দিন" },
  { name: "Seclo", generic: "Omeprazole", form: "Capsule", dosage: "20 mg", frequency: "১+০+০ (সকালে)", timing: "খালি পেটে", duration: "১৪ দিন" },
  { name: "Azith", generic: "Azithromycin", form: "Tablet", dosage: "500 mg", frequency: "০+০+১ (রাতে)", timing: "খাওয়ার পরে", duration: "৩ দিন" },
  { name: "Amlodipine", generic: "Amlodipine Besilate", form: "Tablet", dosage: "5 mg", frequency: "০+০+১ (রাতে)", timing: "ঘুমানোর আগে", duration: "চলবে / Continue" },
  { name: "Montelukast", generic: "Montelukast", form: "Tablet", dosage: "10 mg", frequency: "০+০+১ (রাতে)", timing: "ঘুমানোর আগে", duration: "১ মাস" },
  { name: "Losartan", generic: "Losartan", form: "Tablet", dosage: "50 mg", frequency: "১+০+০ (সকালে)", timing: "খাওয়ার আগে", duration: "চলবে / Continue" },
  { name: "Metformin", generic: "Metformin", form: "Tablet", dosage: "500 mg", frequency: "১+০+১ (সকাল-রাত)", timing: "খাওয়ার পরে", duration: "চলবে / Continue" },
  { name: "Symbion", generic: "Budesonide + Formoterol", form: "Inhaler", dosage: "200/6 mcg", frequency: "১+০+১ (সকাল-রাত)", timing: "প্রয়োজনে", duration: "২ মাস" },
  { name: "Fexo", generic: "Fexofenadine", form: "Tablet", dosage: "120 mg", frequency: "০+০+১ (রাতে)", timing: "খাওয়ার পরে", duration: "১৪ দিন" },
  { name: "Atova", generic: "Atorvastatin Calcium", form: "Tablet", dosage: "10 mg", frequency: "০+০+১ (রাতে)", timing: "খাওয়ার পরে", duration: "৩ মাস" },
];
const advices = ["ঠাণ্ডা, ধুলাবালি এড়িয়ে চলবেন", "সময়মত ঔষধ সেবন করুন", "প্রচুর পানি পান করুন", "পর্যাপ্ত বিশ্রাম নিন", "লাল মাংস, লবণ, চর্বি যুক্ত খাবার নিষেধ", "নিয়মিত হাঁটুন / ব্যায়াম করুন"];
const timeSlots = ["06:00 PM", "06:15 PM", "06:30 PM", "06:45 PM", "07:00 PM", "07:15 PM", "07:30 PM", "07:45 PM", "08:00 PM", "08:15 PM", "08:30 PM"];

// ---- BLOG POSTS ----
const blogPosts = [
  { title: { en: "Understanding High Blood Pressure: A Complete Guide", bn: "উচ্চ রক্তচাপ বোঝা: একটি সম্পূর্ণ গাইড" }, category: "Patient Education", tags: ["HTN", "Preventive Health"], body: { en: "High blood pressure (hypertension) is one of the most common conditions affecting adults worldwide...\n\n## What is Blood Pressure?\n\nBlood pressure is the force of blood pushing against your artery walls...\n\n## Risk Factors\n\n- Family history\n- Obesity\n- High salt intake\n- Sedentary lifestyle\n- Smoking\n\n## Management\n\nLifestyle modifications combined with medication can effectively control blood pressure.", bn: "" } },
  { title: { en: "Managing Diabetes: Diet, Exercise, and Medication", bn: "ডায়াবেটিস নিয়ন্ত্রণ: খাদ্যাভ্যাস, ব্যায়াম ও ওষুধ" }, category: "Patient Education", tags: ["DM", "Diet"], body: { en: "Diabetes mellitus is a chronic condition that requires daily management...\n\n## Types of Diabetes\n\n### Type 1\nAutoimmune condition where the body attacks insulin-producing cells.\n\n### Type 2\nMost common form, related to lifestyle and genetics.\n\n## Dietary Guidelines\n\n- Reduce sugar and refined carbohydrates\n- Increase fiber intake\n- Eat regular, balanced meals\n- Monitor portion sizes", bn: "" } },
  { title: { en: "Asthma: Causes, Triggers, and Modern Treatment", bn: "অ্যাজমা: কারণ, ট্রিগার ও আধুনিক চিকিৎসা" }, category: "Clinical Notes", tags: ["Asthma", "Respiratory"], body: { en: "Asthma is a chronic airway disease characterized by inflammation and bronchospasm...\n\n## Common Triggers\n\n- Dust and allergens\n- Cold air\n- Exercise\n- Respiratory infections\n- Smoke and pollution\n\n## Treatment Approach\n\nModern asthma management uses a stepwise approach with inhaled corticosteroids as the cornerstone of therapy.", bn: "" } },
  { title: { en: "Importance of Regular Health Checkups", bn: "নিয়মিত স্বাস্থ্য পরীক্ষার গুরুত্ব" }, category: "Preventive Health", tags: ["Screening", "Prevention"], body: { en: "Regular health checkups can detect problems before they start...\n\n## Recommended Screenings\n\n- Blood pressure: Every year after 18\n- Blood sugar: Every 3 years after 45\n- Cholesterol: Every 5 years after 20\n- Cancer screenings: Based on age and risk factors", bn: "" } },
  { title: { en: "Gastric Problems: Causes and Solutions", bn: "গ্যাস্ট্রিক সমস্যা: কারণ ও সমাধান" }, category: "Patient Education", tags: ["GERD", "Gastric"], body: { en: "Gastric problems including acidity, bloating, and GERD are extremely common in Bangladesh...\n\n## Common Causes\n\n- Irregular eating habits\n- Spicy and oily food\n- Stress\n- H. pylori infection\n- NSAID use\n\n## Prevention\n\n- Eat on time\n- Avoid lying down immediately after meals\n- Reduce spicy food", bn: "" } },
  { title: { en: "Antibiotic Resistance: A Growing Threat", bn: "অ্যান্টিবায়োটিক রেজিস্ট্যান্স: একটি ক্রমবর্ধমান হুমকি" }, category: "Research", tags: ["Antibiotics", "Public Health"], body: { en: "Antibiotic resistance is one of the biggest threats to global health...\n\n## Why Does It Happen?\n\n- Overuse of antibiotics\n- Not completing prescribed courses\n- Self-medication\n- Use in livestock\n\n## What You Can Do\n\n- Never take antibiotics without a doctor's prescription\n- Complete the full course\n- Don't share antibiotics", bn: "" } },
  { title: { en: "Heart Health: Warning Signs You Should Never Ignore", bn: "হার্টের স্বাস্থ্য: যে লক্ষণগুলো কখনো উপেক্ষা করবেন না" }, category: "Health Tips", tags: ["Cardiology", "Emergency"], body: { en: "Cardiovascular disease remains the leading cause of death worldwide...\n\n## Warning Signs\n\n- Chest pain or pressure\n- Shortness of breath\n- Pain radiating to arm or jaw\n- Unusual fatigue\n- Dizziness\n\n## When to Seek Emergency Care\n\nIf you experience chest pain lasting more than a few minutes, call emergency services immediately.", bn: "" } },
  { title: { en: "Seasonal Allergies in Bangladesh", bn: "বাংলাদেশে ঋতুজনিত অ্যালার্জি" }, category: "Health Tips", tags: ["Allergy", "Seasonal"], body: { en: "Seasonal allergies affect millions in Bangladesh, particularly during season changes...\n\n## Common Allergens\n\n- Pollen\n- Dust mites\n- Mold spores\n- Air pollution\n\n## Management\n\n- Antihistamines\n- Nasal sprays\n- Avoiding triggers\n- Keeping windows closed during high pollen days", bn: "" } },
  { title: { en: "Vitamin D Deficiency: The Silent Epidemic", bn: "ভিটামিন ডি এর ঘাটতি: নীরব মহামারী" }, category: "Research", tags: ["Vitamin D", "Nutrition"], body: { en: "Despite living in a sunny country, vitamin D deficiency is surprisingly common in Bangladesh...\n\n## Who Is at Risk?\n\n- Office workers with little sun exposure\n- Women who cover most of their skin\n- Elderly people\n- Dark-skinned individuals\n\n## Symptoms\n\n- Bone pain\n- Muscle weakness\n- Fatigue\n- Depression", bn: "" } },
  { title: { en: "Mental Health Awareness: Breaking the Stigma", bn: "মানসিক স্বাস্থ্য সচেতনতা: কলঙ্ক ভাঙা" }, category: "Health Tips", tags: ["Mental Health", "Awareness"], body: { en: "Mental health is just as important as physical health, yet stigma prevents many from seeking help...\n\n## Common Conditions\n\n- Depression\n- Anxiety\n- Sleep disorders\n- PTSD\n\n## When to Seek Help\n\n- Persistent sadness for more than 2 weeks\n- Inability to function normally\n- Thoughts of self-harm\n- Substance abuse", bn: "" } },
];

async function main() {
  console.log("=== Seeding Demo Data ===\n");

  // 1. Create 10 Blog Posts
  console.log("Creating 10 blog posts...");
  for (let i = 0; i < blogPosts.length; i++) {
    const bp = blogPosts[i];
    const slug = bp.title.en.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "-").slice(0, 60);
    await prisma.blogPost.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        title: bp.title,
        excerpt: { en: bp.body.en.split("\n")[0].slice(0, 150) + "...", bn: "" },
        body: bp.body,
        date: dateStr(-(i * 7 + randomBetween(1, 5))),
        readingMinutes: randomBetween(4, 8),
        tags: bp.tags,
        category: bp.category,
        coverImage: "",
        published: true,
        disclaimer: "",
        references: "",
        reviewedBy: "Dr. Mahmud ul Hasan Miju",
        reviewedDate: dateStr(-i * 7),
      },
    });
  }
  console.log("  ✓ 10 blog posts created\n");

  // 2. Create 50 Patients with Consultations
  console.log("Creating 50 patients with consultations...");
  const patientIds: string[] = [];
  const patientPhones: string[] = [];

  for (let i = 0; i < 50; i++) {
    const isMale = i < 25;
    const name = isMale ? maleNames[i] : femaleNames[i - 25];
    const phone = `017${String(randomBetween(10000000, 99999999))}`;
    const age = String(randomBetween(18, 75));
    const gender = isMale ? "Male" : "Female";
    const patientId = `P-${String(i + 2).padStart(4, "0")}`; // P-0002 to P-0051

    const patient = await prisma.patient.create({
      data: {
        patientId,
        name,
        age,
        gender,
        phone,
        email: "",
        address: randomFrom(addresses),
        notes: "",
      },
    });
    patientIds.push(patient.id);
    patientPhones.push(phone);

    // Create 1-3 consultations per patient (in the past)
    const numConsultations = randomBetween(1, 3);
    for (let j = 0; j < numConsultations; j++) {
      const daysAgo = randomBetween(1, 90);
      const numMeds = randomBetween(2, 5);
      const meds = [];
      const usedIdx = new Set<number>();
      for (let k = 0; k < numMeds; k++) {
        let idx = randomBetween(0, medicines.length - 1);
        while (usedIdx.has(idx)) idx = randomBetween(0, medicines.length - 1);
        usedIdx.add(idx);
        const m = medicines[idx];
        meds.push({ ...m, type: "brand", specialNote: "" });
      }

      const numAdvices = randomBetween(2, 4);
      const selectedAdvices: string[] = [];
      for (let k = 0; k < numAdvices; k++) {
        const adv = randomFrom(advices);
        if (!selectedAdvices.includes(adv)) selectedAdvices.push(adv);
      }

      await prisma.consultation.create({
        data: {
          patientId: patient.id,
          date: dateStr(-daysAgo),
          chamberId: "main-chamber",
          chiefComplaint: [randomFrom(complaints)],
          history: "",
          onExamination: "",
          diagnosis: [randomFrom(diagnoses), ...(Math.random() > 0.5 ? [randomFrom(diagnoses)] : [])],
          vitalsBp: `${randomBetween(110, 150)}/${randomBetween(70, 95)}`,
          vitalsPulse: String(randomBetween(64, 100)),
          vitalsWeight: `${randomBetween(45, 95)} kg`,
          vitalsSpo2: `${randomBetween(95, 100)}%`,
          vitalsTemp: `${randomBetween(97, 100)}.${randomBetween(0, 9)}°F`,
          vitalsOthers: "",
          medicines: meds as any,
          investigations: Math.random() > 0.6 ? ["CBC", "RBS"] : [],
          investigationDiscount: Math.random() > 0.7 ? 20 : 0,
          advices: selectedAdvices,
          followUp: randomFrom(["৭ দিন পর", "১৪ দিন পর", "১ মাস পর", "২ মাস পর"]),
          notes: "",
          attachment: "",
          paymentFee: 500,
          paymentReceived: 500,
          paymentDiscount: 0,
          paymentStatus: "paid",
          superseded: false,
        },
      });
    }
  }
  console.log("  ✓ 50 patients created with consultations\n");

  // 3. Create 30 appointments for today
  console.log("Creating 30 appointments for today...");
  for (let i = 0; i < 30; i++) {
    const isOldPatient = i < 15; // half are returning patients
    const name = isOldPatient
      ? (i < 12 ? maleNames[i] : femaleNames[i - 12])
      : `New Patient ${i + 1}`;
    const phone = isOldPatient ? patientPhones[i] : `018${String(randomBetween(10000000, 99999999))}`;

    await prisma.appointment.create({
      data: {
        name,
        phone,
        email: "",
        mode: "offline",
        location: "Main Chamber",
        date: today,
        time: timeSlots[i % timeSlots.length],
        reason: randomFrom(complaints),
        status: i < 10 ? "confirmed" : "pending",
      },
    });
  }
  console.log("  ✓ 30 today's appointments created\n");

  // 4. Create 15 appointments per day for next 7 days
  console.log("Creating appointments for next 7 days (15/day)...");
  for (let day = 1; day <= 7; day++) {
    // Skip Friday (if applicable)
    const d = new Date(); d.setDate(d.getDate() + day);
    if (d.getDay() === 5) continue; // Friday off

    for (let i = 0; i < 15; i++) {
      const isOldPatient = Math.random() > 0.4;
      const patientIdx = randomBetween(0, 49);
      const name = isOldPatient
        ? (patientIdx < 25 ? maleNames[patientIdx] : femaleNames[patientIdx - 25])
        : `Patient ${randomBetween(100, 999)}`;
      const phone = isOldPatient ? patientPhones[patientIdx] : `019${String(randomBetween(10000000, 99999999))}`;

      await prisma.appointment.create({
        data: {
          name,
          phone,
          email: "",
          mode: Math.random() > 0.85 ? "online" : "offline",
          location: Math.random() > 0.85 ? "Online" : "Main Chamber",
          date: dateStr(day),
          time: timeSlots[i % timeSlots.length],
          reason: randomFrom(complaints),
          status: Math.random() > 0.6 ? "confirmed" : "pending",
        },
      });
    }
  }
  console.log("  ✓ ~90 future appointments created\n");

  console.log("=== Demo Data Seeding Complete ===");
  console.log(`  Blog posts: 10`);
  console.log(`  Patients: 50 (with 1-3 consultations each)`);
  console.log(`  Today's appointments: 30`);
  console.log(`  Next 7 days: ~15/day (excluding Friday)`);
}

main()
  .catch((e) => { console.error("Error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
