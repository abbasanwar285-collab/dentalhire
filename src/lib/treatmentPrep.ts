/**
 * قاعدة بيانات الأدوات والمواد المطلوبة لكل نوع علاج
 * Treatment Preparation Database
 * 
 * تُستخدم لتوليد مهام التحضير التلقائية للمساعدين
 */

export interface TreatmentPrepInfo {
  treatmentKeywords: string[];  // كلمات مفتاحية لمطابقة نوع العلاج
  label: string;                // اسم العلاج بالعربي
  emoji: string;                // أيقونة
  tools: string[];              // الأدوات المطلوبة
  materials: string[];          // المواد المطلوبة
  notes?: string;               // ملاحظات إضافية
}

export const TREATMENT_PREP_MAP: TreatmentPrepInfo[] = [
  {
    treatmentKeywords: ['حشوة جذر', 'اندو', 'endodontic', 'root canal', 'علاج عصب'],
    label: 'حشوة جذر (علاج عصب)',
    emoji: '🦷',
    tools: [
      'ملفات يدوية (K-Files / H-Files)',
      'ملفات دوّارة (Rotary Files)',
      'حاكم طول (Apex Locator)',
      'إبرة تخدير وكارتريدج',
      'كلامب ورابر دام (Rubber Dam)',
      'فتحة الوصول (Access Burs)',
      'مقبض وملقط',
    ],
    materials: [
      'مادة حشو القنوات (Gutta Percha)',
      'سيلر (Sealer)',
      'محلول غسيل القنوات (NaOCl / EDTA)',
      'نقاط ورقية (Paper Points)',
      'حشوة مؤقتة (Cavit / IRM)',
      'قطن وشاش معقم',
    ],
    notes: 'تأكد من تعقيم الملفات وتجهيز محلول الغسيل مسبقاً',
  },
  {
    treatmentKeywords: ['حشوة ضوئية', 'composite', 'حشوة تجميلية', 'ترميم'],
    label: 'حشوة ضوئية (Composite)',
    emoji: '💡',
    tools: [
      'جهاز الضوء (Light Cure)',
      'حفارة (Excavator)',
      'أدوات حشو (Composite Instruments)',
      'ماتريكس باند (Matrix Band)',
      'ويدج (Wedge)',
      'إبرة تخدير وكارتريدج',
    ],
    materials: [
      'كومبوزت بألوان مختلفة (Composite Shades)',
      'بوندنج (Bonding Agent)',
      'إتش (Etchant / Acid)',
      'فلوابل كومبوزت (Flowable)',
      'ورق تمفصل (Articulating Paper)',
      'البولش (Polishing Discs)',
    ],
  },
  {
    treatmentKeywords: ['قلع', 'extraction', 'خلع'],
    label: 'قلع سن',
    emoji: '🔧',
    tools: [
      'كلابات قلع (Forceps) - حسب السن',
      'رافعات (Elevators)',
      'مشرط جراحي',
      'إبرة تخدير وكارتريدج',
      'ماسك إبرة (Needle Holder)',
      'خيوط جراحية',
    ],
    materials: [
      'شاش معقم',
      'إسفنجة مرقئة (Gelfoam)',
      'مخدر موضعي',
      'محلول ملحي للغسيل',
      'مضاد حيوي (وصفة)',
    ],
    notes: 'تحقق من التاريخ الطبي للمريض (سيولة الدم، أدوية مضادة للتخثر)',
  },
  {
    treatmentKeywords: ['زراعة', 'implant'],
    label: 'زراعة أسنان',
    emoji: '🔩',
    tools: [
      'طقم جراحة الزراعة (Implant Surgical Kit)',
      'محرك زراعة (Implant Motor)',
      'مفتاح عزم (Torque Wrench)',
      'دليل جراحي (Surgical Guide)',
      'مشرط وماسك إبرة',
      'رافع سمحاق (Periosteal Elevator)',
    ],
    materials: [
      'زرعة (Implant Fixture) - بالقياس المطلوب',
      'غلاف شفاء (Healing Abutment)',
      'مادة طعم عظمي (Bone Graft) إن لزم',
      'غشاء (Membrane) إن لزم',
      'خيوط جراحية',
      'محلول ملحي معقم',
      'شاش ومرقئ',
    ],
    notes: 'تأكد من جاهزية صورة الأشعة CBCT وخطة الزراعة',
  },
  {
    treatmentKeywords: ['تنظيف', 'scaling', 'تقليح'],
    label: 'تنظيف الأسنان',
    emoji: '✨',
    tools: [
      'جهاز ألتراسونك (Ultrasonic Scaler)',
      'رؤوس تنظيف (Scaler Tips)',
      'كيوريت يدوي (Curettes)',
      'فرشاة بولش (Prophy Brush / Cup)',
      'جهاز تلميع (Polisher)',
    ],
    materials: [
      'معجون تلميع (Prophy Paste)',
      'خيط أسنان (Dental Floss)',
      'فلورايد موضعي (Topical Fluoride)',
      'شاش ومحلول غسيل',
    ],
  },
  {
    treatmentKeywords: ['تبيض', 'تبييض', 'whitening', 'bleaching', 'تجميل'],
    label: 'تبييض الأسنان',
    emoji: '🌟',
    tools: [
      'جهاز تبييض (Whitening Light/Laser)',
      'واقي لثة (Gingival Barrier)',
      'قالب تبييض (Whitening Tray)',
    ],
    materials: [
      'جل تبييض (Whitening Gel - H₂O₂)',
      'واقي اللثة (Gingival Dam)',
      'فلورايد بعد التبييض',
      'مقياس ألوان (Shade Guide)',
    ],
  },
  {
    treatmentKeywords: ['تقويم', 'orthodontic', 'braces'],
    label: 'تقويم الأسنان',
    emoji: '🔗',
    tools: [
      'حاملات تقويم (Brackets)',
      'أسلاك تقويم (Archwires)',
      'كلابات تقويم (Orthodontic Pliers)',
      'قاطع أسلاك (Wire Cutter)',
      'فاتح فم (Cheek Retractor)',
    ],
    materials: [
      'لاصق تقويم (Bonding Adhesive)',
      'إتش للتقويم (Etchant)',
      'مطاطات (Elastics / Ligatures)',
      'شمع تقويم (Orthodontic Wax)',
      'فلورايد',
    ],
  },
  {
    treatmentKeywords: ['تحضير', 'crown prep', 'تلبيس', 'كراون'],
    label: 'تحضير أسنان (Crown Prep)',
    emoji: '👑',
    tools: [
      'بُرات تحضير (Preparation Burs)',
      'خيط انكماش (Retraction Cord)',
      'طابعة رقمية أو صينية طبعة',
      'إبرة تخدير وكارتريدج',
    ],
    materials: [
      'مادة طبعة (Impression Material / Alginate)',
      'تاج مؤقت (Temporary Crown)',
      'إسمنت مؤقت (Temp Cement)',
      'ورق تمفصل (Articulating Paper)',
    ],
  },
  {
    treatmentKeywords: ['الصاق', 'cementation', 'جسر', 'bridge', 'كراون نهائي'],
    label: 'إلصاق كراون أو جسر',
    emoji: '🏗️',
    tools: [
      'ملقط حمل',
      'أداة إزالة المؤقت',
      'ورق تمفصل (Articulating Paper)',
    ],
    materials: [
      'إسمنت نهائي (Permanent Cement)',
      'مادة تنظيف التحضير',
      'فلوس (Dental Floss)',
      'محلول غسيل',
    ],
  },
  {
    treatmentKeywords: ['طبعة', 'impression', 'scan', 'مسح'],
    label: 'طبعة / مسح رقمي',
    emoji: '📐',
    tools: [
      'صينية طبعة (Impression Tray)',
      'ماسح ضوئي داخل الفم (Intraoral Scanner)',
    ],
    materials: [
      'مادة طبعة سيليكون (Silicone)',
      'الجينات (Alginate)',
      'جبس أسنان (Dental Stone)',
    ],
  },
  {
    treatmentKeywords: ['ترقيع', 'graft', 'عظم', 'لثة', 'membrane'],
    label: 'ترقيع لثة أو عظم',
    emoji: '🩹',
    tools: [
      'طقم جراحة',
      'مشرط ورافع سمحاق',
      'ماسك إبرة وخيوط',
      'إبرة تخدير',
    ],
    materials: [
      'مادة طعم عظمي (Bone Graft)',
      'غشاء (Collagen Membrane)',
      'خيوط جراحية قابلة للامتصاص',
      'محلول ملحي معقم',
      'شاش ومرقئ',
    ],
    notes: 'تأكد من صورة أشعة حديثة وتجهيز المادة مسبقاً',
  },
  {
    treatmentKeywords: ['فحص', 'كشف', 'examination', 'check', 'متابعة'],
    label: 'فحص / كشف عام',
    emoji: '🔍',
    tools: [
      'مرآة فموية (Mouth Mirror)',
      'مسبار (Explorer)',
      'ملقط أقطان',
    ],
    materials: [
      'قفازات وكمامة',
      'أكواب بلاستيكية',
      'مناديل',
    ],
  },
];

/**
 * يبحث عن معلومات التحضير المناسبة لنوع العلاج المحدد
 */
export function findTreatmentPrep(treatmentName: string): TreatmentPrepInfo | null {
  const normalized = treatmentName.toLowerCase().trim();
  
  for (const prep of TREATMENT_PREP_MAP) {
    for (const keyword of prep.treatmentKeywords) {
      if (normalized.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(normalized)) {
        return prep;
      }
    }
  }
  
  return null;
}

/**
 * يُنشئ نص المهمة التلقائية بناءً على الموعد
 */
export function generatePrepTaskDescription(
  patientName: string,
  treatmentName: string,
  time: string,
  prep: TreatmentPrepInfo
): { title: string; description: string } {
  const toolsList = prep.tools.map(t => `  • ${t}`).join('\n');
  const materialsList = prep.materials.map(m => `  • ${m}`).join('\n');

  const title = `${prep.emoji} تحضير ${prep.label} — ${patientName} (${time})`;
  
  let description = `🔧 الأدوات المطلوبة:\n${toolsList}\n\n📦 المواد المطلوبة:\n${materialsList}`;
  
  if (prep.notes) {
    description += `\n\n⚠️ ملاحظة: ${prep.notes}`;
  }

  return { title, description };
}
