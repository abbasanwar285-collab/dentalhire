export interface Neighborhood {
    en: string;
    ar: string;
}

export interface District {
    en: string;
    ar: string;
    neighborhoods?: Neighborhood[];
}

export interface Province {
    en?: string; // Optional English name if not using key
    ar: string;
    districts: District[];
}

export const iraqLocations: Record<string, Province> = {
    'Najaf': {
        ar: 'النجف',
        districts: [
            {
                en: 'Najaf Center',
                ar: 'مركز النجف - المدينة',
                neighborhoods: [
                    { en: 'Old City', ar: 'المدينة القديمة' },
                    { en: 'Al-Hannanah', ar: 'الحنانة' },
                    { en: 'Al-Saad', ar: 'حي السعد' },
                    { en: 'Al-Amir', ar: 'حي الأمير' },
                    { en: 'Al-Zahraa', ar: 'حي الزهراء' },
                    { en: 'Al-Salam', ar: 'حي السلام' },
                    { en: 'Al-Askari', ar: 'حي العسكري' },
                    { en: 'Al-Adala', ar: 'حي العدالة' },
                    { en: 'Al-Ansar', ar: 'حي الأنصار' },
                    { en: 'Al-Muhandiseen', ar: 'حي المهندسين' },
                    { en: 'Al-Jamea', ar: 'حي الجامعة' },
                    { en: 'Al-Nasr', ar: 'حي النصر' },
                    { en: 'Al-Wafaa', ar: 'حي الوفاء' },
                    { en: 'Al-Ghadeer', ar: 'حي الغدير' },
                    { en: 'Al-Furat', ar: 'حي الفرات' },
                    { en: 'Al-Milad', ar: 'حي الميلاد' },
                    { en: 'Al-Muthanna', ar: 'حي المثنى' },
                    { en: 'Al-Quds', ar: 'حي القدس' },
                    { en: 'Al-Rahma', ar: 'حي الرحمة' },
                    { en: 'Al-Jazira', ar: 'حي الجزيرة' },
                    { en: 'Al-Shorta', ar: 'حي الشرطة' },
                    { en: 'Al-Ishtiraki', ar: 'حي الاشتراكي' },
                    { en: 'Al-Krama', ar: 'حي الكرامة' },
                    { en: 'Bahr Al-Najaf', ar: 'بحر النجف' },
                ]
            },
            {
                en: 'Kufa',
                ar: 'قضاء الكوفة',
                neighborhoods: [
                    { en: 'Kufa Center', ar: 'مركز الكوفة' },
                    { en: 'Maysan', ar: 'حي ميسان' },
                    { en: 'Al-Kinda', ar: 'حي كندة' },
                    { en: 'Al-Sahla', ar: 'مسجد السهلة' },
                    { en: 'Al-Barakiya', ar: 'البراكية' },
                    { en: 'Al-Mutanabbi', ar: 'حي المتنبي' },
                    { en: 'Al-Rashid', ar: 'حي الرشيد' },
                    { en: 'Al-Jamhour', ar: 'حي الجمهور' },
                ]
            },
            {
                en: 'Al-Manathira',
                ar: 'قضاء المناذرة',
                neighborhoods: [
                    { en: 'Manathira Center', ar: 'مركز المناذرة' },
                    { en: 'Al-Hira', ar: 'ناحية الحيرة' },
                    { en: 'Al-Qadisiya', ar: 'ناحية القادسية' },
                ]
            },
            {
                en: 'Al-Mishkhab',
                ar: 'قضاء المشخاب',
                neighborhoods: [
                    { en: 'Mishkhab Center', ar: 'مركز المشخاب' },
                    { en: 'Al-Faysaliya', ar: 'الفيصلية' },
                ]
            },
            {
                en: 'Al-Haidariya',
                ar: 'قضاء الحيدرية',
                neighborhoods: [
                    { en: 'Khan Al-Nuss', ar: 'خان النص' },
                    { en: 'Al-Haidariya Center', ar: 'مركز الحيدرية' },
                ]
            },
            {
                en: 'Al-Abbasiya',
                ar: 'قضاء العباسية',
                neighborhoods: [
                    { en: 'Abbasiya Center', ar: 'مركز العباسية' },
                    { en: 'Al-Hurriya', ar: 'ناحية الحرية' },
                ]
            },
        ]
    },
    'Baghdad': {
        ar: 'بغداد',
        districts: [
            {
                en: 'Karkh',
                ar: 'الكرخ',
                neighborhoods: [
                    { en: 'Mansour', ar: 'المنصور' },
                    { en: 'Kadhimiya', ar: 'الكاظمية' },
                    { en: 'Adil', ar: 'العادل' },
                    { en: 'Yarmouk', ar: 'اليرموك' },
                    { en: 'Jihad', ar: 'الجهاد' },
                    { en: 'Amiriya', ar: 'العامرية' },
                    { en: 'Khadra', ar: 'الخضراء' },
                    { en: 'Jamiaa', ar: 'الجامعة' },
                    { en: 'Ghazaliya', ar: 'الغزالية' },
                    { en: 'Hurriya', ar: 'الحرية' },
                    { en: 'Shula', ar: 'الشعلة' },
                    { en: 'Bayaa', ar: 'البياع' },
                    { en: 'Saidiya', ar: 'السيدية' },
                    { en: 'Dora', ar: 'الدورة' },
                    { en: 'Mechanic', ar: 'المكانيك' },
                    { en: 'Iskan', ar: 'الإسكان' },
                    { en: 'Qadisiya', ar: 'القادسية' },
                ]
            },
            {
                en: 'Rusafa',
                ar: 'الرصافة',
                neighborhoods: [
                    { en: 'Adhamiya', ar: 'الأعظمية' },
                    { en: 'Karrada', ar: 'الكرادة' },
                    { en: 'Sadr City', ar: 'مدينة الصدر' },
                    { en: 'Zayyouna', ar: 'زيونة' },
                    { en: 'Palestine Street', ar: 'شارع فلسطين' },
                    { en: 'Bab Al-Muadham', ar: 'باب المعظم' },
                    { en: 'Waziriya', ar: 'الوزيرية' },
                    { en: 'Shaab', ar: 'الشعب' },
                    { en: 'Ur', ar: 'أور' },
                    { en: 'Baghdad Al-Jadida', ar: 'بغداد الجديدة' },
                    { en: 'Ghadir', ar: 'الغدير' },
                    { en: 'Baladiyat', ar: 'البلديات' },
                    { en: 'Mashtal', ar: 'المشتل' },
                    { en: '9 Nissan', ar: '9 نيسان' },
                    { en: 'Habibiya', ar: 'الحبيبية' },
                    { en: 'Husseiniya', ar: 'الحسينية' },
                    { en: 'Kamaliya', ar: 'الكمالية' },
                    { en: 'Bataween', ar: 'البتاوين' },
                    { en: 'Jadriya', ar: 'الجادرية' },
                    { en: 'Arasat', ar: 'العرصات' },
                ]
            },
            {
                en: 'Abu Ghraib',
                ar: 'أبو غريب',
                neighborhoods: [
                    { en: 'Abu Ghraib Center', ar: 'مركز أبو غريب' },
                    { en: 'Radwaniya', ar: 'الرضوانية' },
                    { en: 'Nasr Wa Salam', ar: 'النصر والسلام' },
                ]
            },
            {
                en: 'Mahmoudiya',
                ar: 'المحمودية',
                neighborhoods: [
                    { en: 'Mahmoudiya Center', ar: 'مركز المحمودية' },
                    { en: 'Latifiya', ar: 'اللطيفية' },
                    { en: 'Yusufiya', ar: 'اليوسفية' },
                    { en: 'Rasheed', ar: 'الرشيد' },
                ]
            },
            {
                en: 'Tarmiya',
                ar: 'الطارمية',
                neighborhoods: [
                    { en: 'Tarmiya Center', ar: 'مركز الطارمية' },
                    { en: 'Mashahda', ar: 'المشاهدة' },
                ]
            },
            {
                en: 'Mada\'in',
                ar: 'المدائن',
                neighborhoods: [
                    { en: 'Mada\'in Center', ar: 'مركز المدائن' },
                    { en: 'Jisr Diyala', ar: 'جسر ديالى' },
                    { en: 'Salman Pak', ar: 'سلمان باك' },
                    { en: 'Wahda', ar: 'الوحدة' },
                ]
            },
        ]
    },
    'Basra': {
        ar: 'البصرة',
        districts: [
            {
                en: 'Basra Center',
                ar: 'مركز البصرة',
                neighborhoods: [
                    { en: 'Ashar', ar: 'العشار' },
                    { en: 'Maqal', ar: 'المعقل' },
                    { en: 'Jumhuriya', ar: 'الجمهورية' },
                    { en: 'Jazair', ar: 'الجزائر' },
                    { en: 'Hakimiya', ar: 'الحكيمية' },
                    { en: 'Tannuma', ar: 'التنومة' },
                    { en: 'Bradhiya', ar: 'البراضعية' },
                    { en: 'Hayyaniya', ar: 'الحيانية' },
                    { en: 'Khamsa Meel', ar: 'خمسة ميل' },
                ]
            },
            {
                en: 'Abu Al-Khaseeb',
                ar: 'أبو الخصيب',
                neighborhoods: [
                    { en: 'Abu Al-Khaseeb Center', ar: 'مركز أبو الخصيب' },
                    { en: 'Siba', ar: 'السيبة' },
                ]
            },
            {
                en: 'Zubair',
                ar: 'الزبير',
                neighborhoods: [
                    { en: 'Zubair Center', ar: 'مركز الزبير' },
                    { en: 'Safwan', ar: 'سفوان' },
                    { en: 'Um Qasr', ar: 'أم قصر' },
                ]
            },
            {
                en: 'Shatt Al-Arab',
                ar: 'شط العرب',
                neighborhoods: [
                    { en: 'Shatt Al-Arab Center', ar: 'مركز شط العرب' },
                    { en: 'Hartha', ar: 'الهارثة' },
                    { en: 'Nashwa', ar: 'النشوة' },
                ]
            },
            {
                en: 'Fao',
                ar: 'الفاو',
                neighborhoods: [
                    { en: 'Fao Center', ar: 'مركز الفاو' },
                ]
            },
            {
                en: 'Qurna',
                ar: 'القرنة',
                neighborhoods: [
                    { en: 'Qurna Center', ar: 'مركز القرنة' },
                    { en: 'Midaina', ar: 'المدينة' },
                ]
            },
        ]
    },
    'Erbil': {
        ar: 'أربيل',
        districts: [
            {
                en: 'Erbil Center',
                ar: 'مركز أربيل',
                neighborhoods: [
                    { en: 'Ankawa', ar: 'عنكاوا' },
                    { en: 'Shorsh', ar: 'شورش' },
                    { en: 'Iskan', ar: 'الإسكان' },
                    { en: 'Dream City', ar: 'دريم سيتي' },
                    { en: 'Empire', ar: 'إمباير' },
                    { en: 'Italian Village', ar: 'القرية الإيطالية' },
                ]
            },
            { en: 'Makhmur', ar: 'مخمور', neighborhoods: [{ en: 'Makhmur Center', ar: 'مركز مخمور' }] },
            { en: 'Koya', ar: 'كويسنجق', neighborhoods: [{ en: 'Koya Center', ar: 'مركز كويسنجق' }] },
            { en: 'Soran', ar: 'سوران', neighborhoods: [{ en: 'Soran Center', ar: 'مركز سوران' }] },
            { en: 'Shaqlawa', ar: 'شقلاوة', neighborhoods: [{ en: 'Shaqlawa Center', ar: 'مركز شقلاوة' }] },
            { en: 'Choman', ar: 'جومان', neighborhoods: [{ en: 'Choman Center', ar: 'مركز جومان' }] },
        ]
    },
    'Sulaymaniyah': {
        ar: 'السليمانية',
        districts: [
            {
                en: 'Sulaymaniyah Center',
                ar: 'مركز السليمانية',
                neighborhoods: [
                    { en: 'Bakhtiari', ar: 'بختياري' },
                    { en: 'Raparin', ar: 'رابرين' },
                    { en: 'Salim Street', ar: 'شارع سالم' },
                    { en: 'Azadi', ar: 'آزادي' },
                ]
            },
            { en: 'Halabja', ar: 'حلبجة', neighborhoods: [{ en: 'Halabja Center', ar: 'مركز حلبجة' }] },
            { en: 'Ranya', ar: 'رانية', neighborhoods: [{ en: 'Ranya Center', ar: 'مركز رانية' }] },
            { en: 'Kalar', ar: 'كلار', neighborhoods: [{ en: 'Kalar Center', ar: 'مركز كلار' }] },
            { en: 'Chamchamal', ar: 'جمجمال', neighborhoods: [{ en: 'Chamchamal Center', ar: 'مركز جمجمال' }] },
        ]
    },
    'Duhok': {
        ar: 'دهوك',
        districts: [
            { en: 'Duhok Center', ar: 'مركز دهوك', neighborhoods: [{ en: 'Duhok City', ar: 'مدينة دهوك' }] },
            { en: 'Zakho', ar: 'زاخو', neighborhoods: [{ en: 'Zakho Center', ar: 'مركز زاخو' }] },
            { en: 'Amedi', ar: 'العمادية', neighborhoods: [{ en: 'Amedi Center', ar: 'مركز العمادية' }] },
            { en: 'Semel', ar: 'سيميل', neighborhoods: [{ en: 'Semel Center', ar: 'مركز سيميل' }] },
        ]
    },
    'Kirkuk': {
        ar: 'كركوك',
        districts: [
            {
                en: 'Kirkuk Center',
                ar: 'مركز كركوك',
                neighborhoods: [
                    { en: 'Qala', ar: 'القلعة' },
                    { en: 'Rahimawa', ar: 'رحيماوة' },
                    { en: 'Shorja', ar: 'الشورجة' },
                    { en: 'Iskan', ar: 'الإسكان' },
                ]
            },
            { en: 'Hawija', ar: 'الحويجة', neighborhoods: [{ en: 'Hawija Center', ar: 'مركز الحويجة' }] },
            { en: 'Daquq', ar: 'داقوق', neighborhoods: [{ en: 'Daquq Center', ar: 'مركز داقوق' }] },
            { en: 'Dibis', ar: 'دبس', neighborhoods: [{ en: 'Dibis Center', ar: 'مركز دبس' }] },
        ]
    },
    'Nineveh': {
        ar: 'نينوى',
        districts: [
            {
                en: 'Mosul',
                ar: 'الموصل',
                neighborhoods: [
                    { en: 'Left Bank', ar: 'الساحل الأيسر' },
                    { en: 'Right Bank', ar: 'الساحل الأيمن' },
                    { en: 'Nabi Younis', ar: 'النبي يونس' },
                    { en: 'Maidan', ar: 'الميدان' },
                ]
            },
            { en: 'Tel Afar', ar: 'تلعفر', neighborhoods: [{ en: 'Tel Afar Center', ar: 'مركز تلعفر' }] },
            { en: 'Sinjar', ar: 'سنجار', neighborhoods: [{ en: 'Sinjar Center', ar: 'مركز سنجار' }] },
            { en: 'Hamdaniya', ar: 'الحمدانية', neighborhoods: [{ en: 'Qaraqosh', ar: 'قرقوش' }, { en: 'Bartella', ar: 'برطلة' }] },
        ]
    },
    'Diyala': {
        ar: 'ديالى',
        districts: [
            {
                en: 'Baqubah',
                ar: 'بعقوبة',
                neighborhoods: [
                    { en: 'Tahrir', ar: 'التحرير' },
                    { en: 'Muradiya', ar: 'المرادية' },
                    { en: 'Hakeem', ar: 'الحكيم' },
                ]
            },
            { en: 'Muqdadiya', ar: 'المقدادية', neighborhoods: [{ en: 'Muqdadiya Center', ar: 'مركز المقدادية' }] },
            { en: 'Khanaqin', ar: 'خانقين', neighborhoods: [{ en: 'Khanaqin Center', ar: 'مركز خانقين' }] },
            { en: 'Balad Ruz', ar: 'بلدروز', neighborhoods: [{ en: 'Balad Ruz Center', ar: 'مركز بلدروز' }] },
        ]
    },
    'Anbar': {
        ar: 'الأنبار',
        districts: [
            { en: 'Ramadi', ar: 'الرمادي', neighborhoods: [{ en: 'Ramadi Center', ar: 'مركز الرمادي' }] },
            { en: 'Fallujah', ar: 'الفلوجة', neighborhoods: [{ en: 'Fallujah Center', ar: 'مركز الفلوجة' }, { en: 'Karma', ar: 'الكرمة' }] },
            { en: 'Hit', ar: 'هيت', neighborhoods: [{ en: 'Hit Center', ar: 'مركز هيت' }] },
            { en: 'Haditha', ar: 'حديثة', neighborhoods: [{ en: 'Haditha Center', ar: 'مركز حديثة' }] },
            { en: 'Qa\'im', ar: 'القائم', neighborhoods: [{ en: 'Qa\'im Center', ar: 'مركز القائم' }] },
        ]
    },
    'Karbala': {
        ar: 'كربلاء',
        districts: [
            {
                en: 'Karbala Center',
                ar: 'مركز كربلاء',
                neighborhoods: [
                    { en: 'Old City', ar: 'المدينة القديمة' },
                    { en: 'Husseiniya', ar: 'الحسينية' },
                    { en: 'Bayn Al-Haramayn', ar: 'بين الحرمين' },
                    { en: 'Hur', ar: 'الحر' },
                ]
            },
            { en: 'Ain Al-Tamur', ar: 'عين التمر', neighborhoods: [{ en: 'Ain Al-Tamur Center', ar: 'مركز عين التمر' }] },
            { en: 'Al-Hindiya', ar: 'الهندية', neighborhoods: [{ en: 'Al-Hindiya Center', ar: 'مركز الهندية' }] },
        ]
    },
    'Babil': { // Changed from babil to Babil
        ar: 'بابل',
        districts: [
            {
                en: 'Hilla',
                ar: 'الحلة',
                neighborhoods: [
                    { en: 'Tahrir', ar: 'التحرير' },
                    { en: 'Nile', ar: 'النيل' },
                    { en: 'Wardia', ar: 'الوردية' },
                    { en: 'Askari', ar: 'العسكري' },
                ]
            },
            { en: 'Mahawil', ar: 'المحاويل', neighborhoods: [{ en: 'Mahawil Center', ar: 'مركز المحاويل' }] },
            { en: 'Musayab', ar: 'المسيب', neighborhoods: [{ en: 'Musayab Center', ar: 'مركز المسيب' }] },
            { en: 'Hashimiya', ar: 'الهاشمية', neighborhoods: [{ en: 'Hashimiya Center', ar: 'مركز الهاشمية' }] },
        ]
    },
    'Wasit': {
        ar: 'واسط',
        districts: [
            { en: 'Kut', ar: 'الكوت', neighborhoods: [{ en: 'Kut Center', ar: 'مركز الكوت' }, { en: 'Hai', ar: 'الحي' }] },
            { en: 'Nu\'maniya', ar: 'النعمانية', neighborhoods: [{ en: 'Nu\'maniya Center', ar: 'مركز النعمانية' }] },
            { en: 'Suwaira', ar: 'الصويرة', neighborhoods: [{ en: 'Suwaira Center', ar: 'مركز الصويرة' }] },
            { en: 'Badra', ar: 'بدرة', neighborhoods: [{ en: 'Badra Center', ar: 'مركز بدرة' }] },
        ]
    },
    'Maysan': {
        ar: 'ميسان',
        districts: [
            { en: 'Amara', ar: 'العمارة', neighborhoods: [{ en: 'Amara Center', ar: 'مركز العمارة' }] },
            { en: 'Majar Al-Kabir', ar: 'المجر الكبير', neighborhoods: [{ en: 'Majar Center', ar: 'مركز المجر' }] },
            { en: 'Ali Al-Gharbi', ar: 'علي الغربي', neighborhoods: [{ en: 'Ali Al-Gharbi Center', ar: 'مركز علي الغربي' }] },
            { en: 'Qalat Saleh', ar: 'قلعة صالح', neighborhoods: [{ en: 'Qalat Saleh Center', ar: 'مركز قلعة صالح' }] },
        ]
    },
    'Dhi Qar': {
        ar: 'ذي قار',
        districts: [
            { en: 'Nasiriyah', ar: 'الناصرية', neighborhoods: [{ en: 'Nasiriyah Center', ar: 'مركز الناصرية' }, { en: 'Haboubi', ar: 'الحبوبي' }] },
            { en: 'Suq Al-Shuyukh', ar: 'سوق الشيوخ', neighborhoods: [{ en: 'Suq Al-Shuyukh Center', ar: 'مركز سوق الشيوخ' }] },
            { en: 'Shatra', ar: 'الشطرة', neighborhoods: [{ en: 'Shatra Center', ar: 'مركز الشطرة' }] },
            { en: 'Rifai', ar: 'الرفاعي', neighborhoods: [{ en: 'Rifai Center', ar: 'مركز الرفاعي' }] },
        ]
    },
    'Muthanna': {
        ar: 'المثنى',
        districts: [
            { en: 'Samawah', ar: 'السماوة', neighborhoods: [{ en: 'Samawah Center', ar: 'مركز السماوة' }] },
            { en: 'Rumaitha', ar: 'الرميثة', neighborhoods: [{ en: 'Rumaitha Center', ar: 'مركز الرميثة' }] },
            { en: 'Khidir', ar: 'الخضر', neighborhoods: [{ en: 'Khidir Center', ar: 'مركز الخضر' }] },
        ]
    },
    'Qadisiyah': {
        ar: 'القادسية',
        districts: [
            { en: 'Diwaniyah', ar: 'الديوانية', neighborhoods: [{ en: 'Diwaniyah Center', ar: 'مركز الديوانية' }] },
            { en: 'Afak', ar: 'عفك', neighborhoods: [{ en: 'Afak Center', ar: 'مركز عفك' }] },
            { en: 'Shamiya', ar: 'الشامية', neighborhoods: [{ en: 'Shamiya Center', ar: 'مركز الشامية' }] },
            { en: 'Hamza', ar: 'الحمزة', neighborhoods: [{ en: 'Hamza Center', ar: 'مركز الحمزة' }] },
        ]
    },
    'Saladin': {
        ar: 'صلاح الدين',
        districts: [
            { en: 'Tikrit', ar: 'تكريت', neighborhoods: [{ en: 'Tikrit Center', ar: 'مركز تكريت' }] },
            { en: 'Samarra', ar: 'سامراء', neighborhoods: [{ en: 'Samarra Center', ar: 'مركز سامراء' }] },
            { en: 'Baiji', ar: 'بيجي', neighborhoods: [{ en: 'Baiji Center', ar: 'مركز بيجي' }] },
            { en: 'Shirqat', ar: 'الشرقاط', neighborhoods: [{ en: 'Shirqat Center', ar: 'مركز الشرقاط' }] },
            { en: 'Balad', ar: 'بلد', neighborhoods: [{ en: 'Balad Center', ar: 'مركز بلد' }] },
        ]
    },
};

