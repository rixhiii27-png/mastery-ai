import type {
  ClassLevel,
  CurriculumLesson,
  CurriculumUnitChapter,
  DifficultyLevel,
  LessonType,
  SubjectCategory,
} from '../types/mastery';

interface RawChapterLessonSeed {
  chapterId: string;
  subjectId: string;
  classLevel: ClassLevel;
  subject: string;
  subjectCategory: SubjectCategory;
  unitNumber: number;
  unitName: string;
  chapterNumber: number;
  title: string;
  description: string;
  sourceUrl: string;
  lessons: {
    lessonId: string;
    lessonNumber: number;
    lessonTitle: string;
    lessonType: LessonType;
    lessonDescription: string;
    topics: string[];
    concepts: string[];
    learningObjectives: string[];
    estimatedStudyTime: number;
    difficultyLevel: DifficultyLevel;
    prerequisites: string[];
  }[];
}

const NOW_ISO = '2026-04-01T00:00:00.000Z';
const SESSION = '2026-27';

const RAW_SEEDS: RawChapterLessonSeed[] = [
  // =========================================================================
  // CLASS 10 — MAIN ACADEMIC, LANGUAGES & SKILL EDUCATION
  // =========================================================================
  {
    chapterId: 'c10_math_ch4',
    subjectId: 'cbse27_c10_main_mathematics',
    classLevel: '10',
    subject: 'Mathematics',
    subjectCategory: 'main_academic',
    unitNumber: 2,
    unitName: 'Unit II: Algebra',
    chapterNumber: 4,
    title: 'Quadratic Equations',
    description:
      'Standard form of quadratic equations, factorization, quadratic formula, discriminant analysis, and real-world situational modeling.',
    sourceUrl: 'https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart1/Maths_SecP1X_2026-27.pdf',
    lessons: [
      {
        lessonId: 'les_c10_math_ch4_1',
        lessonNumber: 1,
        lessonTitle: 'Standard Form & Solution by Factorisation',
        lessonType: 'numerical',
        lessonDescription:
          'Identify quadratic equations of the form ax^2 + bx + c = 0 (a != 0) and solve them by splitting the middle term.',
        topics: ['Standard form ax^2 + bx + c = 0', 'Zero product property', 'Splitting the middle term'],
        concepts: ['Quadratic Standard Form', 'Factorisation of Quadratics'],
        learningObjectives: [
          'Distinguish quadratic equations from linear and cubic expressions',
          'Find real roots accurately using factorisation',
        ],
        estimatedStudyTime: 30,
        difficultyLevel: 'foundational',
        prerequisites: ['Linear Equations in One Variable', 'Polynomial Factorisation'],
      },
      {
        lessonId: 'les_c10_math_ch4_2',
        lessonNumber: 2,
        lessonTitle: 'Quadratic Formula & Nature of Roots (Discriminant)',
        lessonType: 'numerical',
        lessonDescription:
          'Apply the quadratic formula and classify root behaviour using the discriminant D = b^2 - 4ac.',
        topics: ['Quadratic formula derivation', 'Discriminant D = b^2 - 4ac', 'Real distinct, equal, and no real roots'],
        concepts: ['Discriminant & Nature of Roots', 'Quadratic Formula'],
        learningObjectives: [
          'Compute the discriminant without sign errors',
          'Determine parameter k for equal or real roots',
        ],
        estimatedStudyTime: 35,
        difficultyLevel: 'standard',
        prerequisites: ['Standard Form & Solution by Factorisation'],
      },
      {
        lessonId: 'les_c10_math_ch4_3',
        lessonNumber: 3,
        lessonTitle: 'Situational Word Problems with Quadratics',
        lessonType: 'case_study',
        lessonDescription:
          'Translate age, speed-distance-time, and geometric area scenarios into quadratic equations and reject extraneous roots.',
        topics: ['Variable formulation', 'Speed-time equations', 'Physical feasibility of roots'],
        concepts: ['Quadratic Word Problem Modelling'],
        learningObjectives: [
          'Formulate algebraic equations from narrative descriptions',
          'Validate which algebraic roots satisfy real-world constraints',
        ],
        estimatedStudyTime: 35,
        difficultyLevel: 'application',
        prerequisites: ['Quadratic Formula & Nature of Roots (Discriminant)'],
      },
    ],
  },
  {
    chapterId: 'c10_math_ch8',
    subjectId: 'cbse27_c10_main_mathematics',
    classLevel: '10',
    subject: 'Mathematics',
    subjectCategory: 'main_academic',
    unitNumber: 5,
    unitName: 'Unit V: Trigonometry',
    chapterNumber: 8,
    title: 'Introduction to Trigonometry',
    description:
      'Trigonometric ratios of acute angles in right triangles, standard angle values (0 to 90 degrees), and fundamental identities.',
    sourceUrl: 'https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart1/Maths_SecP1X_2026-27.pdf',
    lessons: [
      {
        lessonId: 'les_c10_math_ch8_1',
        lessonNumber: 1,
        lessonTitle: 'Trigonometric Ratios & Standard Angles',
        lessonType: 'numerical',
        lessonDescription:
          'Define sin, cos, tan, cosec, sec, and cot relative to a reference acute angle and evaluate expressions at 0, 30, 45, 60, and 90 degrees.',
        topics: ['Opposite, adjacent, hypotenuse', 'Reciprocal ratios', 'Standard angle table'],
        concepts: ['Trigonometric Ratios of Acute Angles', 'Standard Angle Evaluation'],
        learningObjectives: [
          'Identify perpendicular and base dynamically based on the chosen angle',
          'Evaluate exact trigonometric values without decimals',
        ],
        estimatedStudyTime: 30,
        difficultyLevel: 'foundational',
        prerequisites: ['Pythagoras Theorem', 'Similar Right Triangles'],
      },
      {
        lessonId: 'les_c10_math_ch8_2',
        lessonNumber: 2,
        lessonTitle: 'Pythagorean Trigonometric Identities & Proofs',
        lessonType: 'theory',
        lessonDescription:
          'Prove and apply sin^2 A + cos^2 A = 1, 1 + tan^2 A = sec^2 A, and 1 + cot^2 A = cosec^2 A in identity transformations.',
        topics: ['sin^2 A + cos^2 A = 1', '1 + tan^2 A = sec^2 A', 'Algebraic LHS-to-RHS proofs'],
        concepts: ['Fundamental Trigonometric Identities'],
        learningObjectives: [
          'Derive the three Pythagorean trigonometric identities from a right triangle',
          'Prove multi-step trigonometric identities cleanly',
        ],
        estimatedStudyTime: 40,
        difficultyLevel: 'application',
        prerequisites: ['Trigonometric Ratios & Standard Angles'],
      },
    ],
  },
  {
    chapterId: 'c10_sci_ch11',
    subjectId: 'cbse27_c10_main_science',
    classLevel: '10',
    subject: 'Science',
    subjectCategory: 'main_academic',
    unitNumber: 4,
    unitName: 'Unit IV: Effects of Current',
    chapterNumber: 11,
    title: 'Electricity',
    description:
      'Electric current, potential difference, Ohm law, resistivity, series and parallel resistor circuits, heating effect, and electrical power.',
    sourceUrl: 'https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart1/Science_SecP1_2026-27.pdf',
    lessons: [
      {
        lessonId: 'les_c10_sci_ch11_1',
        lessonNumber: 1,
        lessonTitle: 'Electric Current, Potential Difference & Ohm Law',
        lessonType: 'practical',
        lessonDescription:
          'Relate charge flow, voltage, resistance, and V-I graph slope while understanding factors affecting conductor resistivity.',
        topics: ['I = Q/t and V = W/Q', 'Ohm Law V = IR', 'Resistivity R = rho*L/A'],
        concepts: ['Ohm Law & Resistance', 'Factors Affecting Resistivity'],
        learningObjectives: [
          'Interpret V-I graphs to compare resistances',
          'Calculate resistance changes when a wire is stretched or shortened',
        ],
        estimatedStudyTime: 35,
        difficultyLevel: 'foundational',
        prerequisites: ['SI Units & Basic Circuit Symbols'],
      },
      {
        lessonId: 'les_c10_sci_ch11_2',
        lessonNumber: 2,
        lessonTitle: 'Resistors in Series & Parallel Combinations',
        lessonType: 'numerical',
        lessonDescription:
          'Analyse current division, potential distribution, and equivalent resistance across series, parallel, and mixed circuit networks.',
        topics: ['Series Rs = R1 + R2 + R3', 'Parallel 1/Rp = 1/R1 + 1/R2', 'Domestic parallel wiring advantages'],
        concepts: ['Series & Parallel Equivalent Resistance'],
        learningObjectives: [
          'Avoid reciprocal inversion errors when computing parallel resistance',
          'Compute branch currents and voltage drops in mixed circuits',
        ],
        estimatedStudyTime: 40,
        difficultyLevel: 'standard',
        prerequisites: ['Electric Current, Potential Difference & Ohm Law'],
      },
      {
        lessonId: 'les_c10_sci_ch11_3',
        lessonNumber: 3,
        lessonTitle: 'Joule Heating Effect & Electrical Power',
        lessonType: 'numerical',
        lessonDescription:
          'Apply H = I^2 Rt and electrical power formulas to heating appliances, fuses, and commercial kWh energy billing.',
        topics: ['Joule law of heating', 'Power forms VI, I^2R, V^2/R', 'Commercial unit 1 kWh = 3.6 x 10^6 J'],
        concepts: ['Joule Heating & Electric Power'],
        learningObjectives: [
          'Select the right power formula for constant-voltage vs constant-current circuits',
          'Compute monthly household electricity cost in kWh',
        ],
        estimatedStudyTime: 30,
        difficultyLevel: 'standard',
        prerequisites: ['Resistors in Series & Parallel Combinations'],
      },
    ],
  },
  {
    chapterId: 'c10_sci_ch5',
    subjectId: 'cbse27_c10_main_science',
    classLevel: '10',
    subject: 'Science',
    subjectCategory: 'main_academic',
    unitNumber: 2,
    unitName: 'Unit II: World of Living',
    chapterNumber: 5,
    title: 'Life Processes',
    description:
      'Essential biological maintenance processes in plants and animals: nutrition, respiration, transportation, and excretion.',
    sourceUrl: 'https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart1/Science_SecP1_2026-27.pdf',
    lessons: [
      {
        lessonId: 'les_c10_sci_ch5_1',
        lessonNumber: 1,
        lessonTitle: 'Autotrophic & Heterotrophic Nutrition',
        lessonType: 'theory',
        lessonDescription:
          'Understand photosynthesis mechanisms, stomatal regulation, and enzyme-driven human digestion across the alimentary canal.',
        topics: ['Light & dark steps of photosynthesis', 'Role of bile, pepsin, trypsin, lipase', 'Villi absorption'],
        concepts: ['Photosynthesis Mechanism', 'Human Digestive Enzymes'],
        learningObjectives: [
          'Trace chemical breakdown of starch, proteins, and fats',
          'Explain how stomatal guard cells regulate gas exchange',
        ],
        estimatedStudyTime: 35,
        difficultyLevel: 'foundational',
        prerequisites: ['Cell Organelles'],
      },
      {
        lessonId: 'les_c10_sci_ch5_2',
        lessonNumber: 2,
        lessonTitle: 'Respiration, Double Circulation & Excretion',
        lessonType: 'theory',
        lessonDescription:
          'Compare aerobic vs anaerobic pathways, trace mammalian double circulation through the four-chambered heart, and map nephron filtration.',
        topics: ['Pyruvate breakdown pathways', 'Human heart double circulation', 'Nephron ultrafiltration & reabsorption'],
        concepts: ['Aerobic vs Anaerobic Respiration', 'Double Circulation & Nephron Function'],
        learningObjectives: [
          'Explain why warm-blooded mammals require separation of oxygenated and deoxygenated blood',
          'Describe selective reabsorption inside a nephron tubule',
        ],
        estimatedStudyTime: 40,
        difficultyLevel: 'standard',
        prerequisites: ['Autotrophic & Heterotrophic Nutrition'],
      },
    ],
  },
  {
    chapterId: 'c10_sst_ch1',
    subjectId: 'cbse27_c10_main_social_science',
    classLevel: '10',
    subject: 'Social Science',
    subjectCategory: 'main_academic',
    unitNumber: 1,
    unitName: 'India and the Contemporary World - II (History)',
    chapterNumber: 1,
    title: 'The Rise of Nationalism in Europe',
    description:
      'French Revolution ideals, liberal nationalism, 1848 revolutions, German and Italian unification, and Balkan nationalism.',
    sourceUrl: 'https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart1/SocialScience_SecP1X_2026-27.pdf',
    lessons: [
      {
        lessonId: 'les_c10_sst_ch1_1',
        lessonNumber: 1,
        lessonTitle: 'French Revolution, Napoleonic Code & Liberal Nationalism',
        lessonType: 'historical',
        lessonDescription:
          'Examine how collective identity emerged in France, how the Civil Code of 1804 reshaped Europe, and how Vienna 1815 conservatism reacted.',
        topics: ['La patrie & le citoyen', 'Civil Code of 1804', 'Treaty of Vienna 1815', 'Zollverein customs union'],
        concepts: ['Liberal Nationalism in Europe', 'Conservatism After 1815'],
        learningObjectives: [
          'Analyse administrative reforms introduced by Napoleon across Europe',
          'Connect economic liberalism (Zollverein) with political unification',
        ],
        estimatedStudyTime: 35,
        difficultyLevel: 'standard',
        prerequisites: ['The French Revolution (Class 9)'],
      },
      {
        lessonId: 'les_c10_sst_ch1_2',
        lessonNumber: 2,
        lessonTitle: 'Unification of Germany, Italy & Visualising the Nation',
        lessonType: 'historical',
        lessonDescription:
          'Compare Bismarck Prussian-led unification of Germany with Cavour, Mazzini, and Garibaldi in Italy, plus allegorical symbols like Germania.',
        topics: ['Otto von Bismarck', 'Mazzini, Cavour, Garibaldi', 'Marianne & Germania allegories', 'Balkan tensions'],
        concepts: ['German & Italian Unification', 'Nationalism & Imperialism'],
        learningObjectives: [
          'Contrast bottom-up revolutionary movements with state-led unification',
          'Explain how Balkan rivalries contributed to the First World War',
        ],
        estimatedStudyTime: 35,
        difficultyLevel: 'standard',
        prerequisites: ['French Revolution, Napoleonic Code & Liberal Nationalism'],
      },
    ],
  },
  {
    chapterId: 'c10_eng_ch1',
    subjectId: 'cbse27_c10_lang_english_language_and_literature',
    classLevel: '10',
    subject: 'English - Language and Literature',
    subjectCategory: 'language',
    unitNumber: 1,
    unitName: 'Reading, Writing, Grammar & Literature',
    chapterNumber: 1,
    title: 'Analytical Writing, Grammar & Literary Interpretation',
    description:
      'Core CBSE Class 10 English competencies: tense/modal accuracy, reported speech, analytical paragraph writing, and thematic prose/poetry analysis.',
    sourceUrl: 'https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart1/English_LL_SecP1_2026-27.pdf',
    lessons: [
      {
        lessonId: 'les_c10_eng_ch1_1',
        lessonNumber: 1,
        lessonTitle: 'Tenses, Subject-Verb Concord & Reported Speech',
        lessonType: 'grammar',
        lessonDescription:
          'Master CBSE integrated grammar editing, gap-filling, and direct-to-indirect speech transformation rules.',
        topics: ['Tense backshifting', 'Subject-verb agreement traps', 'Determiners & modals'],
        concepts: ['Integrated Grammar & Reported Speech'],
        learningObjectives: [
          'Convert interrogative and imperative sentences accurately into reported speech',
          'Spot subject-verb concord errors with collective and compound subjects',
        ],
        estimatedStudyTime: 30,
        difficultyLevel: 'foundational',
        prerequisites: ['Basic Clause Structure'],
      },
      {
        lessonId: 'les_c10_eng_ch1_2',
        lessonNumber: 2,
        lessonTitle: 'Prose Themes, Poetic Devices & Analytical Paragraphs',
        lessonType: 'literature',
        lessonDescription:
          'Extract central themes, tone, metaphor, irony, and symbolism in literary extracts and write evidence-backed analytical paragraphs.',
        topics: ['Theme & character motivation', 'Poetic devices (metaphor, irony, alliteration)', 'Data-driven analytical paragraphs'],
        concepts: ['Literary Inference & Poetic Devices', 'Analytical Paragraph Composition'],
        learningObjectives: [
          'Support literary interpretations with textual evidence rather than plot summary',
          'Structure a concise 100-120 word analytical paragraph from charts or cues',
        ],
        estimatedStudyTime: 35,
        difficultyLevel: 'standard',
        prerequisites: ['Tenses, Subject-Verb Concord & Reported Speech'],
      },
    ],
  },
  {
    chapterId: 'c10_ai_ch1',
    subjectId: 'cbse27_c10_skill_417',
    classLevel: '10',
    subject: 'Artificial Intelligence',
    subjectCategory: 'skill_education',
    unitNumber: 2,
    unitName: 'Subject-Specific Skills (Code 417)',
    chapterNumber: 1,
    title: 'AI Project Cycle, Evaluation & NLP',
    description:
      'Structured AI Project Cycle (Problem Scoping to Deployment), confusion matrix evaluation metrics, and Natural Language Processing fundamentals.',
    sourceUrl: 'https://cbseacademic.nic.in/web_material/Curriculum27/Sec/417-AI-X.pdf',
    lessons: [
      {
        lessonId: 'les_c10_ai_ch1_1',
        lessonNumber: 1,
        lessonTitle: '4Ws Problem Scoping & AI Project Cycle',
        lessonType: 'project_based',
        lessonDescription:
          'Scope real-world SDG-aligned AI projects using the 4Ws canvas (Who, What, Where, Why), data acquisition, exploration, and ethical checks.',
        topics: ['4Ws Problem Canvas', 'Data acquisition & bias', 'Rule-based vs learning-based models'],
        concepts: ['AI Project Cycle & 4Ws Canvas', 'AI Ethics & Bias'],
        learningObjectives: [
          'Frame a well-bounded AI problem statement using the 4Ws canvas',
          'Identify potential dataset bias before training a model',
        ],
        estimatedStudyTime: 35,
        difficultyLevel: 'foundational',
        prerequisites: ['Basic Digital Literacy'],
      },
      {
        lessonId: 'les_c10_ai_ch1_2',
        lessonNumber: 2,
        lessonTitle: 'Model Evaluation: Confusion Matrix, Precision, Recall & F1',
        lessonType: 'skill_based',
        lessonDescription:
          'Interpret True Positives, False Positives, False Negatives, and True Negatives to pick precision vs recall for high-stakes tasks.',
        topics: ['Confusion Matrix (TP, FP, FN, TN)', 'Accuracy vs Precision vs Recall', 'F1 Score calculation'],
        concepts: ['Confusion Matrix & F1 Score'],
        learningObjectives: [
          'Compute Accuracy, Precision, Recall, and F1 Score from a 2x2 matrix',
          'Explain why high accuracy alone fails on imbalanced datasets',
        ],
        estimatedStudyTime: 35,
        difficultyLevel: 'standard',
        prerequisites: ['4Ws Problem Scoping & AI Project Cycle'],
      },
    ],
  },
  {
    chapterId: 'c10_it_ch1',
    subjectId: 'cbse27_c10_skill_402',
    classLevel: '10',
    subject: 'Information Technology',
    subjectCategory: 'skill_education',
    unitNumber: 3,
    unitName: 'Subject-Specific Skills (Code 402)',
    chapterNumber: 1,
    title: 'Database Management Systems & SQL Basics',
    description:
      'Relational database concepts, primary and foreign keys, table design, forms, queries, and structured data retrieval.',
    sourceUrl: 'https://cbseacademic.nic.in/web_material/Curriculum27/Sec/402-IT-X.pdf',
    lessons: [
      {
        lessonId: 'les_c10_it_ch1_1',
        lessonNumber: 1,
        lessonTitle: 'Relational Tables, Keys & Data Integrity',
        lessonType: 'skill_based',
        lessonDescription:
          'Design normalized relational tables using primary keys, composite keys, foreign keys, and referential integrity rules.',
        topics: ['RDBMS terminology (tuple, attribute)', 'Primary vs Foreign key', 'One-to-many relationships'],
        concepts: ['Relational Keys & Referential Integrity'],
        learningObjectives: [
          'Select appropriate data types and primary keys for student/inventory tables',
          'Prevent orphan records using referential integrity',
        ],
        estimatedStudyTime: 30,
        difficultyLevel: 'foundational',
        prerequisites: ['Spreadsheets Basics'],
      },
    ],
  },

  // =========================================================================
  // CLASS 11 — ACADEMIC ELECTIVES (SCIENCE, COMMERCE, CS), LANGUAGE & SKILL
  // =========================================================================
  {
    chapterId: 'c11_phy_ch4',
    subjectId: 'cbse27_c11_elec_physics',
    classLevel: '11',
    subject: 'Physics',
    subjectCategory: 'academic_elective',
    unitNumber: 3,
    unitName: 'Unit III: Laws of Motion',
    chapterNumber: 4,
    title: 'Laws of Motion',
    description:
      'Newton laws of motion, linear momentum conservation, free-body diagrams, static and kinetic friction, and circular motion on banked roads.',
    sourceUrl: 'https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart2/Physics_SecP2_2026-27.pdf',
    lessons: [
      {
        lessonId: 'les_c11_phy_ch4_1',
        lessonNumber: 1,
        lessonTitle: 'Newton Laws, Impulse & Free-Body Diagrams',
        lessonType: 'numerical',
        lessonDescription:
          'Draw clean free-body diagrams for connected blocks, pulleys, and inclined planes and apply F_net = dp/dt.',
        topics: ['Inertia & frames of reference', 'Impulse-momentum theorem', 'Pulley-string tension systems'],
        concepts: ['Newton Second Law & FBD', 'Conservation of Linear Momentum'],
        learningObjectives: [
          'Isolate bodies accurately in free-body diagrams without double-counting internal forces',
          'Solve two-block and Atwood-machine acceleration problems',
        ],
        estimatedStudyTime: 40,
        difficultyLevel: 'standard',
        prerequisites: ['Vectors & Kinematics in 1D/2D'],
      },
      {
        lessonId: 'les_c11_phy_ch4_2',
        lessonNumber: 2,
        lessonTitle: 'Friction & Dynamics of Circular Motion',
        lessonType: 'numerical',
        lessonDescription:
          'Differentiate self-adjusting static friction from kinetic friction and derive safe turning speeds on level and banked roads.',
        topics: ['f_s <= mu_s N vs f_k = mu_k N', 'Angle of repose', 'Centripetal force on banked curves'],
        concepts: ['Static vs Kinetic Friction', 'Banked Road Circular Dynamics'],
        learningObjectives: [
          'Check whether a block remains stationary before applying kinetic friction',
          'Derive maximum safe speed on a banked track with friction',
        ],
        estimatedStudyTime: 40,
        difficultyLevel: 'application',
        prerequisites: ['Newton Laws, Impulse & Free-Body Diagrams'],
      },
    ],
  },
  {
    chapterId: 'c11_chem_ch4',
    subjectId: 'cbse27_c11_elec_chemistry',
    classLevel: '11',
    subject: 'Chemistry',
    subjectCategory: 'academic_elective',
    unitNumber: 4,
    unitName: 'Unit IV: Chemical Bonding and Molecular Structure',
    chapterNumber: 4,
    title: 'Chemical Bonding and Molecular Structure',
    description:
      'Ionic and covalent bonding, Lewis structures, VSEPR geometry, valence bond theory, hybridisation, and molecular orbital theory.',
    sourceUrl: 'https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart2/Chemistry_SecP2_2026-27.pdf',
    lessons: [
      {
        lessonId: 'les_c11_chem_ch4_1',
        lessonNumber: 1,
        lessonTitle: 'VSEPR Theory & Molecular Geometry',
        lessonType: 'theory',
        lessonDescription:
          'Predict 3D molecular shapes and bond angle deviations from lone pair-bond pair repulsions (lp-lp > lp-bp > bp-bp).',
        topics: ['Electron domain geometry vs molecular shape', 'NH3 and H2O bond angle compression', 'Expanded octets (SF6, PCl5)'],
        concepts: ['VSEPR Molecular Shapes', 'Lone Pair Repulsion & Bond Angles'],
        learningObjectives: [
          'Distinguish electron geometry from actual molecular shape',
          'Explain why H2O has a 104.5 degree angle instead of 109.5 degrees',
        ],
        estimatedStudyTime: 35,
        difficultyLevel: 'standard',
        prerequisites: ['Electronic Configuration & Valence Electrons'],
      },
      {
        lessonId: 'les_c11_chem_ch4_2',
        lessonNumber: 2,
        lessonTitle: 'Hybridisation & Molecular Orbital Theory (MOT)',
        lessonType: 'theory',
        lessonDescription:
          'Assign sp, sp2, sp3 hybridisation in organic/inorganic molecules and compute bond order and paramagnetism using MOT.',
        topics: ['sp, sp2, sp3 hybrid orbitals', 'Sigma vs pi bonds', 'MO energy diagrams for O2 and N2'],
        concepts: ['Orbital Hybridisation', 'Molecular Orbital Bond Order'],
        learningObjectives: [
          'Calculate bond order and predict magnetic nature of homonuclear diatomic species',
          'Explain why O2 is paramagnetic despite an even number of electrons',
        ],
        estimatedStudyTime: 40,
        difficultyLevel: 'application',
        prerequisites: ['VSEPR Theory & Molecular Geometry'],
      },
    ],
  },
  {
    chapterId: 'c11_math_ch12',
    subjectId: 'cbse27_c11_elec_mathematics',
    classLevel: '11',
    subject: 'Mathematics',
    subjectCategory: 'academic_elective',
    unitNumber: 4,
    unitName: 'Unit IV: Calculus',
    chapterNumber: 12,
    title: 'Limits and Derivatives',
    description:
      'Intuitive and algebraic evaluation of limits, standard trigonometric limits, first-principle derivatives, and algebra of derivatives.',
    sourceUrl: 'https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart2/Maths_SecP2_2026-27.pdf',
    lessons: [
      {
        lessonId: 'les_c11_math_ch12_1',
        lessonNumber: 1,
        lessonTitle: 'Algebraic & Trigonometric Limits',
        lessonType: 'numerical',
        lessonDescription:
          'Evaluate indeterminate 0/0 limits via factorisation, rationalisation, and the standard limit lim(x->0) sin(x)/x = 1.',
        topics: ['Left-hand & right-hand limits', 'Indeterminate 0/0 resolution', 'lim(x->0) sin(x)/x = 1'],
        concepts: ['Existence of Limits', 'Standard Trigonometric Limits'],
        learningObjectives: [
          'Distinguish limit value as x approaches a from f(a)',
          'Apply standard algebraic and trigonometric limit theorems accurately',
        ],
        estimatedStudyTime: 35,
        difficultyLevel: 'standard',
        prerequisites: ['Functions & Trigonometry'],
      },
      {
        lessonId: 'les_c11_math_ch12_2',
        lessonNumber: 2,
        lessonTitle: 'First-Principle Derivatives, Product & Quotient Rules',
        lessonType: 'numerical',
        lessonDescription:
          'Interpret derivative as instantaneous rate of change and tangent slope, then apply sum, product, and quotient rules.',
        topics: ['First principles lim(h->0) [f(x+h)-f(x)]/h', 'Power rule', 'Product & quotient rules'],
        concepts: ['Derivative from First Principles', 'Product & Quotient Differentiation Rules'],
        learningObjectives: [
          'Differentiate polynomial and trigonometric functions from first principles',
          'Avoid sign errors in the quotient rule numerator',
        ],
        estimatedStudyTime: 40,
        difficultyLevel: 'standard',
        prerequisites: ['Algebraic & Trigonometric Limits'],
      },
    ],
  },
  {
    chapterId: 'c11_acc_ch3',
    subjectId: 'cbse27_c11_elec_accountancy',
    classLevel: '11',
    subject: 'Accountancy',
    subjectCategory: 'academic_elective',
    unitNumber: 2,
    unitName: 'Unit II: Accounting Process',
    chapterNumber: 3,
    title: 'Recording of Business Transactions & Ledger',
    description:
      'Accounting equation, rules of debit and credit, journalising transactions with GST awareness, ledger posting, and trial balance.',
    sourceUrl: 'https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart2/Accountancy_SecP2_2026-27.pdf',
    lessons: [
      {
        lessonId: 'les_c11_acc_ch3_1',
        lessonNumber: 1,
        lessonTitle: 'Accounting Equation & Rules of Debit and Credit',
        lessonType: 'numerical',
        lessonDescription:
          'Verify Assets = Liabilities + Capital across transactions and classify accounts under modern and traditional rules.',
        topics: ['Assets = Liabilities + Equity', 'Modern 5-account classification', 'Double-entry duality'],
        concepts: ['Accounting Equation', 'Double-Entry Debit & Credit Rules'],
        learningObjectives: [
          'Identify debit and credit impacts for capital, drawings, expenses, and revenues',
          'Ensure every transaction preserves balance sheet equality',
        ],
        estimatedStudyTime: 35,
        difficultyLevel: 'foundational',
        prerequisites: ['Basic Accounting Terms'],
      },
      {
        lessonId: 'les_c11_acc_ch3_2',
        lessonNumber: 2,
        lessonTitle: 'Journalising, Ledger Posting & Trial Balance',
        lessonType: 'case_study',
        lessonDescription:
          'Record compound journal entries, post accurately to T-accounts, balance ledgers, and verify arithmetical accuracy via a Trial Balance.',
        topics: ['Simple & compound journal entries', 'Ledger balancing (c/d & b/d)', 'Trial Balance verification'],
        concepts: ['Journal & Ledger Posting', 'Trial Balance Preparation'],
        learningObjectives: [
          'Convert business vouchers into balanced journal entries with narrations',
          'Identify errors that a Trial Balance catches vs errors it cannot detect',
        ],
        estimatedStudyTime: 40,
        difficultyLevel: 'standard',
        prerequisites: ['Accounting Equation & Rules of Debit and Credit'],
      },
    ],
  },
  {
    chapterId: 'c11_cs_ch2',
    subjectId: 'cbse27_c11_elec_computer_science',
    classLevel: '11',
    subject: 'Computer Science',
    subjectCategory: 'academic_elective',
    unitNumber: 2,
    unitName: 'Unit II: Computational Thinking and Programming - 1',
    chapterNumber: 2,
    title: 'Python Programming Fundamentals & Collections',
    description:
      'Python control flow, loops, strings, lists, tuples, dictionaries, and algorithmic problem-solving patterns.',
    sourceUrl: 'https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart2/Computer_Science_SecP2_2026-27.pdf',
    lessons: [
      {
        lessonId: 'les_c11_cs_ch2_1',
        lessonNumber: 1,
        lessonTitle: 'Mutable vs Immutable Data Types: Lists, Tuples & Dictionaries',
        lessonType: 'practical',
        lessonDescription:
          'Understand memory mutability, slicing, list comprehensions, and dictionary key-value lookups in Python 3.',
        topics: ['String & tuple immutability', 'List aliasing vs copying', 'Dictionary traversal & frequency maps'],
        concepts: ['Python Mutability & Reference Semantics', 'Lists, Tuples & Dictionaries'],
        learningObjectives: [
          'Predict output of list aliasing vs shallow copy operations',
          'Use dictionaries to build clean O(1) frequency counters',
        ],
        estimatedStudyTime: 35,
        difficultyLevel: 'standard',
        prerequisites: ['Python Variables, Conditionals & Loops'],
      },
    ],
  },
  {
    chapterId: 'c11_ai_ch1',
    subjectId: 'cbse27_c11_skill_843',
    classLevel: '11',
    subject: 'Artificial Intelligence',
    subjectCategory: 'skill_education',
    unitNumber: 2,
    unitName: 'Subject-Specific Skills (Code 843 - Class XI)',
    chapterNumber: 1,
    title: 'Python for Data Science, Linear Regression & AI Ethics',
    description:
      'NumPy/Pandas data handling, exploratory data visualization, linear regression intuition, and ethical AI governance.',
    sourceUrl: 'https://cbseacademic.nic.in/web_material/Curriculum27/SrSec/843-AI_XI.pdf',
    lessons: [
      {
        lessonId: 'les_c11_ai_ch1_1',
        lessonNumber: 1,
        lessonTitle: 'Data Literacy, Cleaning & Linear Regression Foundations',
        lessonType: 'project_based',
        lessonDescription:
          'Prepare structured tabular datasets, handle missing values and outliers, and fit an interpretable linear trend line.',
        topics: ['Data cleaning & missing values', 'Correlation vs causation', 'Best-fit line & residual error'],
        concepts: ['Tabular Data Preprocessing', 'Linear Regression Intuition'],
        learningObjectives: [
          'Distinguish correlation from causation in real-world datasets',
          'Explain how residuals measure goodness of fit in linear regression',
        ],
        estimatedStudyTime: 40,
        difficultyLevel: 'standard',
        prerequisites: ['Basic Python & Statistics'],
      },
    ],
  },

  // =========================================================================
  // CLASS 12 — SCIENCE, COMMERCE, HUMANITIES, LANGUAGES & SKILL EDUCATION
  // =========================================================================
  {
    chapterId: 'c12_phy_ch1',
    subjectId: 'cbse27_c12_elec_physics',
    classLevel: '12',
    subject: 'Physics',
    subjectCategory: 'academic_elective',
    unitNumber: 1,
    unitName: 'Unit I: Electrostatics',
    chapterNumber: 1,
    title: 'Electric Charges and Fields',
    description:
      'Quantization of charge, Coulomb law in vector form, electric field lines, electric dipoles, electric flux, and Gauss law applications.',
    sourceUrl: 'https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart2/Physics_SecP2_2026-27.pdf',
    lessons: [
      {
        lessonId: 'les_c12_phy_ch1_1',
        lessonNumber: 1,
        lessonTitle: 'Coulomb Law, Superposition & Electric Field',
        lessonType: 'numerical',
        lessonDescription:
          'Compute electrostatic force vectors using superposition and map electric field intensity for point charges and dipoles.',
        topics: ['Vector form of Coulomb law', 'Principle of superposition', 'Axial & equatorial dipole fields'],
        concepts: ['Coulomb Law & Superposition', 'Electric Dipole Field & Torque'],
        learningObjectives: [
          'Add electric field vectors correctly using symmetry and components',
          'Relate axial and equatorial field magnitudes for a short electric dipole',
        ],
        estimatedStudyTime: 40,
        difficultyLevel: 'standard',
        prerequisites: ['Vector Addition (Class 11)'],
      },
      {
        lessonId: 'les_c12_phy_ch1_2',
        lessonNumber: 2,
        lessonTitle: 'Electric Flux & Gauss Law Applications',
        lessonType: 'theory',
        lessonDescription:
          'Calculate flux through closed surfaces and use Gaussian symmetry for infinite line charges, plane sheets, and spherical shells.',
        topics: ['Flux phi = E . A', 'Gauss law phi = q_enclosed / epsilon_0', 'Field inside a hollow charged shell'],
        concepts: ['Gauss Law & Gaussian Symmetry'],
        learningObjectives: [
          'Choose appropriate Gaussian surfaces exploiting spherical, cylindrical, or planar symmetry',
          'Explain why enclosed charge alone governs total closed-surface flux',
        ],
        estimatedStudyTime: 40,
        difficultyLevel: 'application',
        prerequisites: ['Coulomb Law, Superposition & Electric Field'],
      },
    ],
  },
  {
    chapterId: 'c12_chem_ch2',
    subjectId: 'cbse27_c12_elec_chemistry',
    classLevel: '12',
    subject: 'Chemistry',
    subjectCategory: 'academic_elective',
    unitNumber: 2,
    unitName: 'Unit II: Electrochemistry',
    chapterNumber: 2,
    title: 'Electrochemistry',
    description:
      'Galvanic cells, standard electrode potentials, Nernst equation, Gibbs free energy link, molar conductivity, Kohlrausch law, and Faraday electrolysis.',
    sourceUrl: 'https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart2/Chemistry_SecP2_2026-27.pdf',
    lessons: [
      {
        lessonId: 'les_c12_chem_ch2_1',
        lessonNumber: 1,
        lessonTitle: 'Galvanic Cells, Electrode Potentials & Nernst Equation',
        lessonType: 'numerical',
        lessonDescription:
          'Calculate E_cell under non-standard concentrations using the Nernst equation and relate E^0_cell to Delta G^0 and K_c.',
        topics: ['E_cell = E_cathode - E_anode', 'Nernst equation at 298 K', 'Delta G^0 = -nFE^0'],
        concepts: ['Nernst Equation', 'Electrochemical Cell Spontaneity'],
        learningObjectives: [
          'Identify anode and cathode from standard reduction potentials without sign flips',
          'Solve 298 K Nernst numericals accurately with reaction quotient Q',
        ],
        estimatedStudyTime: 40,
        difficultyLevel: 'application',
        prerequisites: ['Redox Reactions & Chemical Equilibrium (Class 11)'],
      },
      {
        lessonId: 'les_c12_chem_ch2_2',
        lessonNumber: 2,
        lessonTitle: 'Conductance, Kohlrausch Law & Faraday Laws of Electrolysis',
        lessonType: 'numerical',
        lessonDescription:
          'Analyse conductivity vs molar conductivity on dilution for strong and weak electrolytes and quantify electrolytic deposition.',
        topics: ['Kappa vs Lambda_m variation on dilution', 'Kohlrausch independent migration', 'Faraday first & second laws'],
        concepts: ['Molar Conductivity & Kohlrausch Law', 'Faraday Laws of Electrolysis'],
        learningObjectives: [
          'Explain why kappa decreases while Lambda_m increases upon dilution',
          'Calculate mass deposited by a given current over time using 1 F = 96500 C/mol',
        ],
        estimatedStudyTime: 35,
        difficultyLevel: 'standard',
        prerequisites: ['Galvanic Cells, Electrode Potentials & Nernst Equation'],
      },
    ],
  },
  {
    chapterId: 'c12_math_ch5',
    subjectId: 'cbse27_c12_elec_mathematics',
    classLevel: '12',
    subject: 'Mathematics',
    subjectCategory: 'academic_elective',
    unitNumber: 3,
    unitName: 'Unit III: Calculus',
    chapterNumber: 5,
    title: 'Continuity and Differentiability',
    description:
      'Continuity at a point, differentiability, chain rule, implicit and logarithmic differentiation, parametric forms, and second-order derivatives.',
    sourceUrl: 'https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart2/Maths_SecP2_2026-27.pdf',
    lessons: [
      {
        lessonId: 'les_c12_math_ch5_1',
        lessonNumber: 1,
        lessonTitle: 'Continuity, Differentiability & Chain Rule',
        lessonType: 'numerical',
        lessonDescription:
          'Test piecewise continuity using LHL = RHL = f(a), distinguish continuity from differentiability, and differentiate composite functions.',
        topics: ['Piecewise continuity testing', 'Sharp corners (|x|) non-differentiability', 'Multi-layer chain rule'],
        concepts: ['Continuity & Differentiability', 'Chain Rule Differentiation'],
        learningObjectives: [
          'Explain why every differentiable function is continuous while the converse fails',
          'Differentiate nested composite functions cleanly step by step',
        ],
        estimatedStudyTime: 40,
        difficultyLevel: 'standard',
        prerequisites: ['Limits and Derivatives (Class 11)'],
      },
      {
        lessonId: 'les_c12_math_ch5_2',
        lessonNumber: 2,
        lessonTitle: 'Implicit, Logarithmic & Parametric Differentiation',
        lessonType: 'numerical',
        lessonDescription:
          'Differentiate variable-exponent functions f(x)^g(x) via logarithms and compute dy/dx and d^2y/dx^2 for parametric curves.',
        topics: ['Implicit dy/dx isolation', 'Logarithmic differentiation of u(x)^v(x)', 'Parametric second derivative d/dt(dy/dx) / (dx/dt)'],
        concepts: ['Logarithmic & Parametric Differentiation'],
        learningObjectives: [
          'Avoid the common trap of splitting log(u + v) improperly during logarithmic differentiation',
          'Compute d^2y/dx^2 parametrically without omitting the dt/dx factor',
        ],
        estimatedStudyTime: 40,
        difficultyLevel: 'challenge',
        prerequisites: ['Continuity, Differentiability & Chain Rule'],
      },
    ],
  },
  {
    chapterId: 'c12_bio_ch5',
    subjectId: 'cbse27_c12_elec_biology',
    classLevel: '12',
    subject: 'Biology',
    subjectCategory: 'academic_elective',
    unitNumber: 7,
    unitName: 'Unit VII: Genetics and Evolution',
    chapterNumber: 5,
    title: 'Molecular Basis of Inheritance',
    description:
      'DNA double-helix packaging, semiconservative replication, transcription, genetic code, translation, and lac operon gene regulation.',
    sourceUrl: 'https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart2/Biology_SecP2_2026-27.pdf',
    lessons: [
      {
        lessonId: 'les_c12_bio_ch5_1',
        lessonNumber: 1,
        lessonTitle: 'DNA Replication, Transcription & Genetic Code',
        lessonType: 'theory',
        lessonDescription:
          'Map 5-prime to 3-prime polymerase directionality, leading vs lagging strands, eukaryotic RNA splicing, and triplet codon properties.',
        topics: ['Leading & Okazaki lagging strands', 'Template vs coding strand', 'Degenerate & unambiguous genetic code'],
        concepts: ['Semiconservative DNA Replication', 'Transcription & Genetic Code'],
        learningObjectives: [
          'Deduce mRNA sequence cleanly from a given DNA template or coding strand',
          'Explain why replication is continuous on one strand and discontinuous on the other',
        ],
        estimatedStudyTime: 40,
        difficultyLevel: 'standard',
        prerequisites: ['Cell Division & Nucleic Acid Structure (Class 11)'],
      },
    ],
  },
  {
    chapterId: 'c12_bst_ch2',
    subjectId: 'cbse27_c12_elec_business_studies',
    classLevel: '12',
    subject: 'Business Studies',
    subjectCategory: 'academic_elective',
    unitNumber: 2,
    unitName: 'Part A: Principles and Functions of Management',
    chapterNumber: 2,
    title: 'Principles of Management',
    description:
      'Nature and significance of management principles, Fayol 14 principles of general management, and Taylor scientific management techniques.',
    sourceUrl: 'https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart2/BusinessStudies_SecP2_2026-27.pdf',
    lessons: [
      {
        lessonId: 'les_c12_bst_ch2_1',
        lessonNumber: 1,
        lessonTitle: 'Fayol Principles vs Taylor Scientific Management (Case Studies)',
        lessonType: 'case_study',
        lessonDescription:
          'Diagnose organisational case scenarios using Fayol principles (Unity of Command, Scalar Chain, Esprit de Corps) and Taylor techniques.',
        topics: ['Unity of Command vs Unity of Direction', 'Functional foremanship', 'Differential piece wage system'],
        concepts: ['Fayol Management Principles', 'Taylor Scientific Management'],
        learningObjectives: [
          'Identify violated or applied management principles directly from CBSE business case vignettes',
          'Contrast Fayol top-level administrative focus with Taylor shop-floor efficiency focus',
        ],
        estimatedStudyTime: 35,
        difficultyLevel: 'standard',
        prerequisites: ['Nature and Significance of Management'],
      },
    ],
  },
  {
    chapterId: 'c12_eco_ch1',
    subjectId: 'cbse27_c12_elec_economics',
    classLevel: '12',
    subject: 'Economics',
    subjectCategory: 'academic_elective',
    unitNumber: 1,
    unitName: 'Part A: Introductory Macroeconomics',
    chapterNumber: 1,
    title: 'National Income and Related Aggregates',
    description:
      'Circular flow of income, domestic vs national concepts, GDP deflator, and Value Added, Income, and Expenditure methods of national income.',
    sourceUrl: 'https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart2/Economics_SecP2_2026-27.pdf',
    lessons: [
      {
        lessonId: 'les_c12_eco_ch1_1',
        lessonNumber: 1,
        lessonTitle: 'Converting Aggregates (GDP_MP to NNP_FC) & Three Measurement Methods',
        lessonType: 'numerical',
        lessonDescription:
          'Master Gross/Net (Depreciation), Domestic/National (NFIA), and Market Price/Factor Cost (NIT) conversions and avoid double counting.',
        topics: ['Gross vs Net & Depreciation', 'NFIA & Net Indirect Taxes', 'Value Added, Income & Expenditure methods'],
        concepts: ['National Income Aggregate Conversions', 'Value Added & Income Method'],
        learningObjectives: [
          'Convert seamlessly between any two macroeconomic aggregates without sign errors',
          'Distinguish transfer payments and intermediate goods from final national output',
        ],
        estimatedStudyTime: 40,
        difficultyLevel: 'standard',
        prerequisites: ['Basic Microeconomics & Statistics (Class 11)'],
      },
    ],
  },
  {
    chapterId: 'c12_hist_ch1',
    subjectId: 'cbse27_c12_elec_history',
    classLevel: '12',
    subject: 'History',
    subjectCategory: 'academic_elective',
    unitNumber: 1,
    unitName: 'Themes in Indian History - Part I',
    chapterNumber: 1,
    title: 'Bricks, Beads and Bones: The Harappan Civilisation',
    description:
      'Archaeological evidence of Harappan urban planning, subsistence strategies, craft production, trade networks, seals, and decline debates.',
    sourceUrl: 'https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart2/History_SecP2_2026-27.pdf',
    lessons: [
      {
        lessonId: 'les_c12_hist_ch1_1',
        lessonNumber: 1,
        lessonTitle: 'Mohenjodaro Urbanism, Craft Centres & Archaeological Interpretation',
        lessonType: 'historical',
        lessonDescription:
          'Evaluate citadel vs lower town drainage grids, Chanhudaro bead-making, Mesopotamian trade links, and limits of archaeological inference.',
        topics: ['Grid drainage & Great Bath', 'Chanhudaro & Nageshwar craft centres', 'Harappan seals & weights'],
        concepts: ['Harappan Urban Architecture', 'Archaeological Source Evaluation'],
        learningObjectives: [
          'Distinguish direct material evidence from scholarly hypotheses regarding Harappan authority',
          'Trace long-distance trade networks using archaeological artefacts',
        ],
        estimatedStudyTime: 35,
        difficultyLevel: 'standard',
        prerequisites: ['World History Chronology (Class 11)'],
      },
    ],
  },
  {
    chapterId: 'c12_eng_ch1',
    subjectId: 'cbse27_c12_lang_english_core',
    classLevel: '12',
    subject: 'English Core',
    subjectCategory: 'language',
    unitNumber: 1,
    unitName: 'Reading, Creative Writing & Literature (Code 301)',
    chapterNumber: 1,
    title: 'Formal Writing Skills & Literary Theme Analysis',
    description:
      'Notice writing, formal invitations, job applications, article/report writing, and critical interpretation of Flamingo and Vistas texts.',
    sourceUrl: 'https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart2/English_core_SecP2_2026-27.pdf',
    lessons: [
      {
        lessonId: 'les_c12_eng_ch1_1',
        lessonNumber: 1,
        lessonTitle: 'Critical Extract Analysis & Formal Report/Article Structure',
        lessonType: 'literature',
        lessonDescription:
          'Analyse tone, narrative perspective, and socio-historical themes in extracts while adhering to CBSE format criteria for writing tasks.',
        topics: ['Inferential vs literal comprehension', 'Tone & literary devices', 'Formal article & report rubric'],
        concepts: ['Literary Critical Analysis', 'CBSE Formal Writing Structure'],
        learningObjectives: [
          'Answer competency-based extract questions using concise textual justification',
          'Apply complete format, content, and expression criteria in 120-150 word writing tasks',
        ],
        estimatedStudyTime: 35,
        difficultyLevel: 'standard',
        prerequisites: ['Class 11 Reading & Composition'],
      },
    ],
  },
  {
    chapterId: 'c12_ai_ch1',
    subjectId: 'cbse27_c12_skill_843',
    classLevel: '12',
    subject: 'Artificial Intelligence',
    subjectCategory: 'skill_education',
    unitNumber: 2,
    unitName: 'Subject-Specific Skills (Code 843 - Class XII)',
    chapterNumber: 1,
    title: 'Capstone AI Modelling, Evaluation & Data Storytelling',
    description:
      'End-to-end AI capstone design, train-validation-test splits, RMSE/F1 evaluation, model bias auditing, and narrative data storytelling.',
    sourceUrl: 'https://cbseacademic.nic.in/web_material/Curriculum27/SrSec/843-AI_XII.pdf',
    lessons: [
      {
        lessonId: 'les_c12_ai_ch1_1',
        lessonNumber: 1,
        lessonTitle: 'Train-Test Validation, Cross-Validation & Data Storytelling',
        lessonType: 'project_based',
        lessonDescription:
          'Prevent overfitting using k-fold cross-validation, evaluate regression/classification metrics, and communicate findings through ethical visual narratives.',
        topics: ['Overfitting vs underfitting', 'k-Fold Cross-Validation', 'Narrative + Visuals + Data triad'],
        concepts: ['Cross-Validation & Generalisation', 'Data Storytelling Framework'],
        learningObjectives: [
          'Diagnose overfitting by comparing training and validation error curves',
          'Combine data evidence, visuals, and narrative into an actionable capstone brief',
        ],
        estimatedStudyTime: 40,
        difficultyLevel: 'application',
        prerequisites: ['Class 11 AI Python & Regression Foundations'],
      },
    ],
  },
];

export const SEED_CURRICULUM_CHAPTERS_V2: CurriculumUnitChapter[] = RAW_SEEDS.map((ch) => ({
  chapterId: ch.chapterId,
  subjectId: ch.subjectId,
  academicSession: SESSION,
  classLevel: ch.classLevel,
  subject: ch.subject,
  subjectCategory: ch.subjectCategory,
  unitNumber: ch.unitNumber,
  unitName: ch.unitName,
  chapterNumber: ch.chapterNumber,
  title: ch.title,
  description: ch.description,
  estimatedMinutes: ch.lessons.reduce((sum, l) => sum + l.estimatedStudyTime, 0),
  lessonCount: ch.lessons.length,
  verificationStatus: 'Verified',
  sourceUrl: ch.sourceUrl,
  curriculumVersion: 'CBSE-2026-27-v1',
}));

export const SEED_CURRICULUM_LESSONS: CurriculumLesson[] = RAW_SEEDS.flatMap((ch) =>
  ch.lessons.map((l) => ({
    lessonId: l.lessonId,
    academicSession: SESSION,
    classLevel: ch.classLevel,
    subjectId: ch.subjectId,
    subject: ch.subject,
    subjectCategory: ch.subjectCategory,
    unitName: ch.unitName,
    chapterId: ch.chapterId,
    chapterName: ch.title,
    lessonNumber: l.lessonNumber,
    lessonTitle: l.lessonTitle,
    lessonType: l.lessonType,
    lessonDescription: l.lessonDescription,
    topics: l.topics,
    concepts: l.concepts,
    learningObjectives: l.learningObjectives,
    estimatedStudyTime: l.estimatedStudyTime,
    difficultyLevel: l.difficultyLevel,
    prerequisites: l.prerequisites,
    sourceUrl: ch.sourceUrl,
    verificationStatus: 'Verified',
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
  }))
);
