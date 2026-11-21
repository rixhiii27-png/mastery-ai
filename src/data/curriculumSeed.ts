import type { CurriculumChapter, QuestionItem } from '../types/mastery';

export const CURRICULUM_VERSION = '2025.1-demo-seed';

export const CURRICULUM_COVERAGE_SUMMARY = {
  version: CURRICULUM_VERSION,
  academicSession: '2025-26',
  notice:
    'Representative seed chapters across CBSE Classes 10, 11, and 12 are loaded for demonstration. Official complete CBSE syllabus records can be imported into Firestore via verified curriculum packs without modifying app structure.',
  classesCovered: ['10', '11', '12'] as const,
};

export const SEED_CHAPTERS: CurriculumChapter[] = [
  // =========================================================================
  // CLASS 10
  // =========================================================================
  {
    chapterId: 'cbse_10_math_ch4',
    classLevel: '10',
    subject: 'Mathematics',
    chapterNumber: 4,
    title: 'Quadratic Equations',
    academicSession: '2025-26',
    curriculumVersion: CURRICULUM_VERSION,
    source: 'Demo Seed — Representative CBSE Class 10 Mathematics Outline',
    verificationStatus: 'demo_seed',
    estimatedMinutes: 55,
    learningObjectives: [
      'Identify standard quadratic equations ax^2 + bx + c = 0 where a != 0',
      'Solve quadratic equations by factorisation and the quadratic formula',
      'Determine the nature of roots using the discriminant D = b^2 - 4ac',
      'Formulate and solve word problems reducible to quadratic form',
    ],
    topics: ['Standard Form', 'Factorisation Method', 'Quadratic Formula', 'Nature of Roots'],
    concepts: [
      {
        conceptId: 'c10_math_quad_standard',
        chapterId: 'cbse_10_math_ch4',
        name: 'Standard Form & Identification',
        description: 'Recognizing degree-2 polynomials in one variable and checking non-zero leading coefficient a.',
        prerequisites: ['Linear Equations in One Variable', 'Polynomials (Degree 2)'],
        difficultyLevel: 'foundational',
        keyFormulae: ['ax² + bx + c = 0, a ≠ 0'],
      },
      {
        conceptId: 'c10_math_quad_factorisation',
        chapterId: 'cbse_10_math_ch4',
        name: 'Roots by Factorisation',
        description: 'Splitting the middle term to express ax^2 + bx + c as a product of two linear factors.',
        prerequisites: ['Algebraic Identities', 'Standard Form & Identification'],
        difficultyLevel: 'standard',
        keyFormulae: ['p + q = b, p · q = a · c', '(x - α)(x - β) = 0'],
      },
      {
        conceptId: 'c10_math_quad_discriminant',
        chapterId: 'cbse_10_math_ch4',
        name: 'Discriminant & Nature of Roots',
        description: 'Using D = b^2 - 4ac to classify distinct real roots, equal real roots, or no real roots.',
        prerequisites: ['Quadratic Formula', 'Square Roots & Real Numbers'],
        difficultyLevel: 'application',
        keyFormulae: ['D = b² - 4ac', 'x = (-b ± √D) / (2a)'],
      },
    ],
  },
  {
    chapterId: 'cbse_10_math_ch8',
    classLevel: '10',
    subject: 'Mathematics',
    chapterNumber: 8,
    title: 'Introduction to Trigonometry',
    academicSession: '2025-26',
    curriculumVersion: CURRICULUM_VERSION,
    source: 'Demo Seed — Representative CBSE Class 10 Mathematics Outline',
    verificationStatus: 'demo_seed',
    estimatedMinutes: 60,
    learningObjectives: [
      'Define the six trigonometric ratios of an acute angle in a right triangle',
      'Evaluate trigonometric ratios of standard angles 0°, 30°, 45°, 60°, and 90°',
      'Apply fundamental Pythagorean trigonometric identities to simplify expressions',
    ],
    topics: ['Trigonometric Ratios', 'Standard Angles', 'Trigonometric Identities'],
    concepts: [
      {
        conceptId: 'c10_math_trig_ratios',
        chapterId: 'cbse_10_math_ch8',
        name: 'Trigonometric Ratios in Right Triangles',
        description: 'Relating opposite, adjacent, and hypotenuse relative to a reference acute angle.',
        prerequisites: ['Pythagoras Theorem', 'Similar Right Triangles'],
        difficultyLevel: 'foundational',
        keyFormulae: ['sin θ = Opposite / Hypotenuse', 'cos θ = Adjacent / Hypotenuse', 'tan θ = sin θ / cos θ'],
      },
      {
        conceptId: 'c10_math_trig_identities',
        chapterId: 'cbse_10_math_ch8',
        name: 'Fundamental Trigonometric Identities',
        description: 'Proving and applying sin²θ + cos²θ = 1, 1 + tan²θ = sec²θ, and 1 + cot²θ = cosec²θ.',
        prerequisites: ['Trigonometric Ratios in Right Triangles', 'Algebraic Identities'],
        difficultyLevel: 'application',
        keyFormulae: ['sin²θ + cos²θ = 1', 'sec²θ - tan²θ = 1', 'cosec²θ - cot²θ = 1'],
      },
    ],
  },
  {
    chapterId: 'cbse_10_sci_ch10',
    classLevel: '10',
    subject: 'Science',
    chapterNumber: 10,
    title: 'Light — Reflection and Refraction',
    academicSession: '2025-26',
    curriculumVersion: CURRICULUM_VERSION,
    source: 'Demo Seed — Representative CBSE Class 10 Science Outline',
    verificationStatus: 'demo_seed',
    estimatedMinutes: 65,
    learningObjectives: [
      'Trace ray diagrams for concave and convex spherical mirrors',
      'Apply the New Cartesian Sign Convention accurately in mirror and lens formulas',
      'Calculate refractive index and interpret Snell’s Law of Refraction',
    ],
    topics: ['Spherical Mirrors', 'Mirror Formula & Sign Convention', 'Refraction & Lenses'],
    concepts: [
      {
        conceptId: 'c10_sci_light_sign',
        chapterId: 'cbse_10_sci_ch10',
        name: 'Mirror Formula & Sign Convention',
        description: 'Applying 1/f = 1/v + 1/u with the New Cartesian Sign Convention where object distance u is negative.',
        prerequisites: ['Ray Diagrams of Spherical Mirrors'],
        difficultyLevel: 'application',
        keyFormulae: ['1/f = 1/v + 1/u', 'm = h′/h = -v/u', 'f = R/2'],
      },
      {
        conceptId: 'c10_sci_light_refraction',
        chapterId: 'cbse_10_sci_ch10',
        name: 'Refractive Index & Lens Power',
        description: 'Relating speed of light in media to refractive index and computing lens power in dioptres.',
        prerequisites: ['Laws of Refraction'],
        difficultyLevel: 'standard',
        keyFormulae: ['n = c / v', '1/f = 1/v - 1/u', 'P = 1 / f (in metres)'],
      },
    ],
  },
  {
    chapterId: 'cbse_10_sci_ch12',
    classLevel: '10',
    subject: 'Science',
    chapterNumber: 12,
    title: 'Electricity',
    academicSession: '2025-26',
    curriculumVersion: CURRICULUM_VERSION,
    source: 'Demo Seed — Representative CBSE Class 10 Science Outline',
    verificationStatus: 'demo_seed',
    estimatedMinutes: 55,
    learningObjectives: [
      'Relate electric current, charge, potential difference, and Ohm’s Law',
      'Calculate equivalent resistance for series and parallel resistor networks',
      'Compute electrical power and Joule’s Law of Heating in circuits',
    ],
    topics: ['Ohm’s Law & Resistance', 'Series & Parallel Circuits', 'Electric Power & Heating'],
    concepts: [
      {
        conceptId: 'c10_sci_elec_ohm',
        chapterId: 'cbse_10_sci_ch12',
        name: 'Ohm’s Law & Resistivity',
        description: 'Understanding linear V-I proportionality at constant temperature and material resistivity ρ.',
        prerequisites: ['Electric Charge & Potential Difference'],
        difficultyLevel: 'foundational',
        keyFormulae: ['V = I · R', 'R = ρ · (l / A)'],
      },
      {
        conceptId: 'c10_sci_elec_circuits',
        chapterId: 'cbse_10_sci_ch12',
        name: 'Series & Parallel Resistor Networks',
        description: 'Distinguishing current division in parallel vs voltage division in series combinations.',
        prerequisites: ['Ohm’s Law & Resistivity'],
        difficultyLevel: 'standard',
        keyFormulae: ['R_s = R_1 + R_2', '1/R_p = 1/R_1 + 1/R_2', 'P = V·I = I²R = V²/R'],
      },
    ],
  },

  // =========================================================================
  // CLASS 11
  // =========================================================================
  {
    chapterId: 'cbse_11_phy_ch4',
    classLevel: '11',
    subject: 'Physics',
    chapterNumber: 4,
    title: 'Laws of Motion',
    academicSession: '2025-26',
    curriculumVersion: CURRICULUM_VERSION,
    source: 'Demo Seed — Representative CBSE Class 11 Physics Outline',
    verificationStatus: 'demo_seed',
    estimatedMinutes: 70,
    learningObjectives: [
      'Draw accurate Free Body Diagrams (FBDs) for connected bodies and inclines',
      'Apply Newton’s Second Law in vector component form',
      'Distinguish static friction, limiting friction, and kinetic friction',
    ],
    topics: ['Newton’s Laws & Momentum', 'Free Body Diagrams', 'Friction & Circular Banking'],
    concepts: [
      {
        conceptId: 'c11_phy_lom_fbd',
        chapterId: 'cbse_11_phy_ch4',
        name: 'Free Body Diagrams & Tension',
        description: 'Isolating forces acting ON a body to write net force equations without mixing action-reaction pairs.',
        prerequisites: ['Vector Resolution', 'Kinematics'],
        difficultyLevel: 'standard',
        keyFormulae: ['F_net = m · a', 'p = m · v', 'J = Δp = F · Δt'],
      },
      {
        conceptId: 'c11_phy_lom_friction',
        chapterId: 'cbse_11_phy_ch4',
        name: 'Static vs Kinetic Friction',
        description: 'Understanding static friction as a self-adjusting force up to f_s(max) = μ_s N.',
        prerequisites: ['Free Body Diagrams & Tension'],
        difficultyLevel: 'application',
        keyFormulae: ['f_s ≤ μ_s · N', 'f_k = μ_k · N'],
      },
    ],
  },
  {
    chapterId: 'cbse_11_chem_ch4',
    classLevel: '11',
    subject: 'Chemistry',
    chapterNumber: 4,
    title: 'Chemical Bonding and Molecular Structure',
    academicSession: '2025-26',
    curriculumVersion: CURRICULUM_VERSION,
    source: 'Demo Seed — Representative CBSE Class 11 Chemistry Outline',
    verificationStatus: 'demo_seed',
    estimatedMinutes: 65,
    learningObjectives: [
      'Predict molecular geometry using VSEPR theory and lone-pair repulsions',
      'Identify sp, sp², and sp³ hybridisation in organic and inorganic molecules',
      'Interpret bond order and magnetic behaviour from Molecular Orbital Theory',
    ],
    topics: ['VSEPR Theory', 'Hybridisation', 'Molecular Orbital Theory'],
    concepts: [
      {
        conceptId: 'c11_chem_bond_vsepr',
        chapterId: 'cbse_11_chem_ch4',
        name: 'VSEPR Geometry & Lone-Pair Effects',
        description: 'Determining electron-pair geometry vs actual molecular shape when lone pairs compress bond angles.',
        prerequisites: ['Lewis Dot Structures'],
        difficultyLevel: 'standard',
        keyFormulae: ['lp–lp > lp–bp > bp–bp repulsion'],
      },
      {
        conceptId: 'c11_chem_bond_hybrid',
        chapterId: 'cbse_11_chem_ch4',
        name: 'Orbital Hybridisation & Bond Order',
        description: 'Mixing atomic orbitals to form equivalent hybrid orbitals and computing MO bond order.',
        prerequisites: ['Atomic Orbitals', 'VSEPR Geometry & Lone-Pair Effects'],
        difficultyLevel: 'application',
        keyFormulae: ['Bond Order = ½ (N_b - N_a)'],
      },
    ],
  },
  {
    chapterId: 'cbse_11_math_ch13',
    classLevel: '11',
    subject: 'Mathematics',
    chapterNumber: 13,
    title: 'Limits and Derivatives',
    academicSession: '2025-26',
    curriculumVersion: CURRICULUM_VERSION,
    source: 'Demo Seed — Representative CBSE Class 11 Mathematics Outline',
    verificationStatus: 'demo_seed',
    estimatedMinutes: 60,
    learningObjectives: [
      'Evaluate algebraic and trigonometric limits including indeterminate 0/0 forms',
      'Compute derivatives from first principles and standard differentiation rules',
    ],
    topics: ['Intuitive Idea of Limits', 'Standard Trigonometric Limits', 'First Principle of Derivatives'],
    concepts: [
      {
        conceptId: 'c11_math_calc_limits',
        chapterId: 'cbse_11_math_ch13',
        name: 'Evaluating Indeterminate Limits',
        description: 'Resolving 0/0 forms via factorisation, rationalisation, and standard limit identities.',
        prerequisites: ['Functions & Graphs', 'Factorisation'],
        difficultyLevel: 'standard',
        keyFormulae: ['lim(x→0) (sin x)/x = 1', 'lim(x→a) (xⁿ - aⁿ)/(x - a) = n·aⁿ⁻¹'],
      },
      {
        conceptId: 'c11_math_calc_deriv',
        chapterId: 'cbse_11_math_ch13',
        name: 'Product & Quotient Rule of Derivatives',
        description: 'Differentiating products and ratios of algebraic and trigonometric functions accurately.',
        prerequisites: ['Evaluating Indeterminate Limits'],
        difficultyLevel: 'application',
        keyFormulae: ['(uv)′ = u′v + uv′', '(u/v)′ = (u′v - uv′) / v²'],
      },
    ],
  },

  // =========================================================================
  // CLASS 12
  // =========================================================================
  {
    chapterId: 'cbse_12_phy_ch1',
    classLevel: '12',
    subject: 'Physics',
    chapterNumber: 1,
    title: 'Electric Charges and Fields',
    academicSession: '2025-26',
    curriculumVersion: CURRICULUM_VERSION,
    source: 'Demo Seed — Representative CBSE Class 12 Physics Outline',
    verificationStatus: 'demo_seed',
    estimatedMinutes: 75,
    learningObjectives: [
      'Apply Coulomb’s Law and superposition principle in vector form',
      'Compute electric field due to electric dipoles on axial and equatorial lines',
      'Use Gauss’s Law to find electric fields of symmetric charge distributions',
    ],
    topics: ['Coulomb’s Law & Superposition', 'Electric Dipole', 'Electric Flux & Gauss’s Law'],
    concepts: [
      {
        conceptId: 'c12_phy_elec_gauss',
        chapterId: 'cbse_12_phy_ch1',
        name: 'Electric Flux & Gauss’s Law',
        description: 'Relating closed-surface electric flux to enclosed net charge q_enc / ε₀ independently of Gaussian surface size.',
        prerequisites: ['Vector Dot Product', 'Coulomb’s Law'],
        difficultyLevel: 'application',
        keyFormulae: ['Φ = ∮ E · dA = q_enc / ε₀'],
      },
      {
        conceptId: 'c12_phy_elec_dipole',
        chapterId: 'cbse_12_phy_ch1',
        name: 'Electric Dipole Field & Torque',
        description: 'Finding torque τ = p × E on a dipole in a uniform electric field and axial/equatorial fields.',
        prerequisites: ['Vector Cross Product', 'Electric Field Lines'],
        difficultyLevel: 'standard',
        keyFormulae: ['p = q · 2a', 'τ = pE sin θ'],
      },
    ],
  },
  {
    chapterId: 'cbse_12_chem_ch2',
    classLevel: '12',
    subject: 'Chemistry',
    chapterNumber: 2,
    title: 'Electrochemistry',
    academicSession: '2025-26',
    curriculumVersion: CURRICULUM_VERSION,
    source: 'Demo Seed — Representative CBSE Class 12 Chemistry Outline',
    verificationStatus: 'demo_seed',
    estimatedMinutes: 70,
    learningObjectives: [
      'Calculate standard cell potential E°_cell from standard reduction potentials',
      'Apply the Nernst Equation to non-standard concentrations and equilibrium constants',
      'Relate molar conductivity to dilution for strong and weak electrolytes (Kohlrausch Law)',
    ],
    topics: ['Galvanic Cells', 'Nernst Equation', 'Conductance & Kohlrausch Law'],
    concepts: [
      {
        conceptId: 'c12_chem_echem_nernst',
        chapterId: 'cbse_12_chem_ch2',
        name: 'Nernst Equation & Cell Potential',
        description: 'Computing cell EMF under non-standard ionic concentrations and linking E°_cell to ΔG°.',
        prerequisites: ['Redox Reactions', 'Chemical Equilibrium'],
        difficultyLevel: 'application',
        keyFormulae: ['E_cell = E°_cell - (0.059/n) log Q', 'ΔG° = -nFE°_cell'],
      },
    ],
  },
  {
    chapterId: 'cbse_12_math_ch7',
    classLevel: '12',
    subject: 'Mathematics',
    chapterNumber: 7,
    title: 'Integrals',
    academicSession: '2025-26',
    curriculumVersion: CURRICULUM_VERSION,
    source: 'Demo Seed — Representative CBSE Class 12 Mathematics Outline',
    verificationStatus: 'demo_seed',
    estimatedMinutes: 80,
    learningObjectives: [
      'Evaluate indefinite integrals using substitution, partial fractions, and integration by parts',
      'Apply properties of definite integrals including symmetry and King’s property',
    ],
    topics: ['Integration by Substitution', 'Integration by Parts', 'Definite Integral Properties'],
    concepts: [
      {
        conceptId: 'c12_math_int_sub',
        chapterId: 'cbse_12_math_ch7',
        name: 'Integration by Substitution & Parts',
        description: 'Transforming composite integrands via u-substitution and applying LIATE rule for integration by parts.',
        prerequisites: ['Chain Rule of Differentiation', 'Standard Antiderivatives'],
        difficultyLevel: 'application',
        keyFormulae: ['∫ u dv = uv - ∫ v du', '∫ f(g(x))g′(x)dx = ∫ f(u)du'],
      },
      {
        conceptId: 'c12_math_int_def',
        chapterId: 'cbse_12_math_ch7',
        name: 'Properties of Definite Integrals',
        description: 'Leveraging even/odd symmetry and ∫[a,b] f(x)dx = ∫[a,b] f(a+b-x)dx to simplify definite integrals.',
        prerequisites: ['Integration by Substitution & Parts'],
        difficultyLevel: 'challenge',
        keyFormulae: ['∫₀ᵃ f(x)dx = ∫₀ᵃ f(a-x)dx'],
      },
    ],
  },
];

export const SEED_QUESTIONS: QuestionItem[] = [
  // Class 10 Maths — Quadratic Equations
  {
    questionId: 'q_c10_quad_1',
    conceptId: 'c10_math_quad_standard',
    chapterId: 'cbse_10_math_ch4',
    classLevel: '10',
    subject: 'Mathematics',
    difficultyLevel: 'foundational',
    prompt: 'Which of the following equations is NOT a quadratic equation?',
    options: [
      '(x + 2)² = 2(x - 3)',
      'x² - 2x = (-2)(3 - x)',
      '(x - 2)(x + 1) = (x - 1)(x + 3)',
      'x(x + 1) + 8 = (x + 2)(x - 1) + x²',
    ],
    correctOptionIndex: 2,
    explanation:
      'Expanding (x - 2)(x + 1) = (x - 1)(x + 3) gives x² - x - 2 = x² + 2x - 3. The x² terms cancel out, leaving -3x + 1 = 0, which is linear (a = 0).',
    hint: 'Expand both sides and check whether the x² terms cancel out.',
    commonTrap: 'Students assume any equation containing (x - a)(x + b) is automatically quadratic without checking if x² cancels.',
    sourceType: 'demo_seed',
  },
  {
    questionId: 'q_c10_quad_2',
    conceptId: 'c10_math_quad_factorisation',
    chapterId: 'cbse_10_math_ch4',
    classLevel: '10',
    subject: 'Mathematics',
    difficultyLevel: 'standard',
    prompt: 'What are the roots of the quadratic equation 2x² - 5x + 3 = 0?',
    options: ['x = 1 and x = 3/2', 'x = -1 and x = -3/2', 'x = 1 and x = 2/3', 'x = 3 and x = 1/2'],
    correctOptionIndex: 0,
    explanation:
      'Split the middle term: 2x² - 2x - 3x + 3 = 0 ⇒ 2x(x - 1) - 3(x - 1) = 0 ⇒ (2x - 3)(x - 1) = 0, giving x = 1 and x = 3/2.',
    hint: 'Find two numbers whose sum is -5 and whose product is 2 × 3 = 6.',
    commonTrap: 'Forgetting to divide by the leading coefficient a = 2 when extracting roots from factors.',
    sourceType: 'demo_seed',
  },
  {
    questionId: 'q_c10_quad_3',
    conceptId: 'c10_math_quad_discriminant',
    chapterId: 'cbse_10_math_ch4',
    classLevel: '10',
    subject: 'Mathematics',
    difficultyLevel: 'standard',
    prompt: 'For what value(s) of k does the quadratic equation 2x² + kx + 3 = 0 have two equal real roots?',
    options: ['k = ±2√6', 'k = ±√6', 'k = 24', 'k = ±4√3'],
    correctOptionIndex: 0,
    explanation:
      'Equal real roots occur when D = b² - 4ac = 0. Substituting a = 2, b = k, c = 3 gives k² - 4(2)(3) = 0 ⇒ k² = 24 ⇒ k = ±2√6.',
    hint: 'Set the discriminant b² - 4ac equal to 0 and remember both positive and negative square roots.',
    commonTrap: 'Dropping the ± sign when taking the square root of 24 or computing 4ac as 4 + 2 + 3.',
    sourceType: 'demo_seed',
  },
  {
    questionId: 'q_c10_quad_4',
    conceptId: 'c10_math_quad_discriminant',
    chapterId: 'cbse_10_math_ch4',
    classLevel: '10',
    subject: 'Mathematics',
    difficultyLevel: 'application',
    prompt: 'If the discriminant of 3x² - 4x + c = 0 is negative, what can we conclude about c?',
    options: ['c > 4/3', 'c < 4/3', 'c = 4/3', 'c < -4/3'],
    correctOptionIndex: 0,
    explanation:
      'D < 0 ⇒ (-4)² - 4(3)(c) < 0 ⇒ 16 - 12c < 0 ⇒ 16 < 12c ⇒ c > 16/12 = 4/3.',
    hint: 'Write (-4)² - 4(3)(c) < 0 carefully, keeping (-4)² positive.',
    commonTrap: 'Evaluating (-4)² as -16 instead of +16, or flipping the inequality sign incorrectly.',
    sourceType: 'demo_seed',
  },

  // Class 10 Maths — Trigonometry
  {
    questionId: 'q_c10_trig_1',
    conceptId: 'c10_math_trig_ratios',
    chapterId: 'cbse_10_math_ch8',
    classLevel: '10',
    subject: 'Mathematics',
    difficultyLevel: 'foundational',
    prompt: 'In right triangle ABC right-angled at B, if AB = 24 cm and BC = 7 cm, what is sin A?',
    options: ['7/25', '24/25', '7/24', '24/7'],
    correctOptionIndex: 0,
    explanation:
      'By Pythagoras theorem, AC = √(24² + 7²) = √625 = 25 cm. Opposite side to angle A is BC = 7 cm, so sin A = BC/AC = 7/25.',
    hint: 'First find hypotenuse AC, then identify which side is OPPOSITE to angle A (not angle C).',
    commonTrap: 'Using the adjacent side AB instead of opposite side BC for sin A.',
    sourceType: 'demo_seed',
  },
  {
    questionId: 'q_c10_trig_2',
    conceptId: 'c10_math_trig_identities',
    chapterId: 'cbse_10_math_ch8',
    classLevel: '10',
    subject: 'Mathematics',
    difficultyLevel: 'application',
    prompt: 'What is the simplified value of 9 sec²A - 9 tan²A?',
    options: ['1', '9', '8', '0'],
    correctOptionIndex: 1,
    explanation: 'Factor out 9: 9(sec²A - tan²A). Since 1 + tan²A = sec²A, sec²A - tan²A = 1, so the expression equals 9(1) = 9.',
    hint: 'Factor 9 out of both terms and recall the identity relating sec²A and tan²A.',
    commonTrap: 'Confusing sec²A - tan²A = 1 with 0 or forgetting to multiply by the factored 9.',
    sourceType: 'demo_seed',
  },

  // Class 10 Science — Light
  {
    questionId: 'q_c10_light_1',
    conceptId: 'c10_sci_light_sign',
    chapterId: 'cbse_10_sci_ch10',
    classLevel: '10',
    subject: 'Science',
    difficultyLevel: 'standard',
    prompt: 'An object is placed 30 cm in front of a concave mirror of focal length 15 cm. Using New Cartesian Sign Convention, where is the image formed?',
    options: [
      '30 cm in front of the mirror (v = -30 cm)',
      '30 cm behind the mirror (v = +30 cm)',
      '10 cm in front of the mirror (v = -10 cm)',
      '15 cm in front of the mirror (v = -15 cm)',
    ],
    correctOptionIndex: 0,
    explanation:
      'For a concave mirror, f = -15 cm and u = -30 cm. Using 1/v = 1/f - 1/u = -1/15 - (-1/30) = -1/30 ⇒ v = -30 cm (at the centre of curvature, in front of the mirror).',
    hint: 'For a concave mirror, both focal length f and object distance u are negative.',
    commonTrap: 'Taking f as +15 cm for a concave mirror, which yields an incorrect virtual image distance.',
    sourceType: 'demo_seed',
  },
  {
    questionId: 'q_c10_light_2',
    conceptId: 'c10_sci_light_refraction',
    chapterId: 'cbse_10_sci_ch10',
    classLevel: '10',
    subject: 'Science',
    difficultyLevel: 'standard',
    prompt: 'A convex lens has a focal length of +50 cm. What is its power?',
    options: ['+2.0 D', '+0.02 D', '-2.0 D', '+5.0 D'],
    correctOptionIndex: 0,
    explanation: 'Convert focal length to metres first: f = +50 cm = +0.5 m. Power P = 1/f = 1/0.5 = +2.0 D.',
    hint: 'Always convert focal length from centimetres to metres before calculating P = 1/f.',
    commonTrap: 'Computing 1/50 = 0.02 D without converting centimetres into metres.',
    sourceType: 'demo_seed',
  },

  // Class 10 Science — Electricity
  {
    questionId: 'q_c10_elec_1',
    conceptId: 'c10_sci_elec_ohm',
    chapterId: 'cbse_10_sci_ch12',
    classLevel: '10',
    subject: 'Science',
    difficultyLevel: 'foundational',
    prompt: 'If the length of a uniform copper wire is doubled while its cross-sectional area stays the same, what happens to its resistance and resistivity?',
    options: [
      'Resistance doubles; resistivity remains unchanged',
      'Both resistance and resistivity double',
      'Resistance halves; resistivity remains unchanged',
      'Resistance remains unchanged; resistivity doubles',
    ],
    correctOptionIndex: 0,
    explanation:
      'Resistance R = ρl/A is directly proportional to length l, so doubling l doubles R. Resistivity ρ depends only on the material and temperature, not on wire dimensions.',
    hint: 'Distinguish between geometric property R and material property ρ.',
    commonTrap: 'Assuming resistivity changes when the wire is stretched or lengthened.',
    sourceType: 'demo_seed',
  },
  {
    questionId: 'q_c10_elec_2',
    conceptId: 'c10_sci_elec_circuits',
    chapterId: 'cbse_10_sci_ch12',
    classLevel: '10',
    subject: 'Science',
    difficultyLevel: 'standard',
    prompt: 'Two resistors of 6 Ω and 3 Ω are connected in parallel across a 6 V battery. What is the total current drawn from the battery?',
    options: ['3 A', '0.67 A', '2 A', '9 A'],
    correctOptionIndex: 0,
    explanation:
      'Equivalent parallel resistance: 1/R_p = 1/6 + 1/3 = 3/6 = 1/2 ⇒ R_p = 2 Ω. Total current I = V / R_p = 6 / 2 = 3 A.',
    hint: 'Remember to invert 1/R_p to get R_p before applying I = V/R.',
    commonTrap: 'Adding 6 + 3 = 9 Ω (series formula) or forgetting to take the reciprocal of 1/R_p.',
    sourceType: 'demo_seed',
  },

  // Class 11 Physics — Laws of Motion
  {
    questionId: 'q_c11_lom_1',
    conceptId: 'c11_phy_lom_friction',
    chapterId: 'cbse_11_phy_ch4',
    classLevel: '11',
    subject: 'Physics',
    difficultyLevel: 'application',
    prompt: 'A 4 kg block rests on a horizontal floor with μ_s = 0.5 (g = 10 m/s²). A horizontal push of 12 N is applied. What is the friction force acting on the block?',
    options: ['12 N', '20 N', '0 N', '8 N'],
    correctOptionIndex: 0,
    explanation:
      'Maximum static friction is f_s(max) = μ_s N = 0.5 × (4 × 10) = 20 N. Since applied force (12 N) < 20 N, the block does not move and static friction adjusts to match the applied force: 12 N.',
    hint: 'Check whether the applied force exceeds maximum static friction μ_s N.',
    commonTrap: 'Assuming static friction always equals μ_s N (20 N) even when a smaller force is applied.',
    sourceType: 'demo_seed',
  },
  {
    questionId: 'q_c11_lom_2',
    conceptId: 'c11_phy_lom_fbd',
    chapterId: 'cbse_11_phy_ch4',
    classLevel: '11',
    subject: 'Physics',
    difficultyLevel: 'standard',
    prompt: 'Two blocks of masses 2 kg and 3 kg are connected by a light string on a smooth horizontal table and pulled with 20 N on the 3 kg block. What is the tension in the string?',
    options: ['8 N', '12 N', '20 N', '10 N'],
    correctOptionIndex: 0,
    explanation:
      'System acceleration a = F / (m1 + m2) = 20 / (2 + 3) = 4 m/s². Tension pulls the 2 kg block alone: T = m1 · a = 2 × 4 = 8 N.',
    hint: 'Find the common acceleration of both blocks first, then draw the FBD of the trailing 2 kg block.',
    commonTrap: 'Multiplying the 3 kg mass by acceleration instead of the trailing mass pulled solely by tension.',
    sourceType: 'demo_seed',
  },

  // Class 11 Chemistry — Chemical Bonding
  {
    questionId: 'q_c11_chem_1',
    conceptId: 'c11_chem_bond_vsepr',
    chapterId: 'cbse_11_chem_ch4',
    classLevel: '11',
    subject: 'Chemistry',
    difficultyLevel: 'standard',
    prompt: 'Why is the H–O–H bond angle in H₂O (104.5°) smaller than the H–N–H bond angle in NH₃ (107°)?',
    options: [
      'H₂O has two lone pairs on oxygen, causing stronger lp–lp and lp–bp repulsions than NH₃’s single lone pair',
      'Oxygen is sp² hybridised whereas nitrogen is sp³ hybridised',
      'Hydrogen atoms in H₂O attract each other covalently',
      'Nitrogen has a larger atomic radius than oxygen',
    ],
    correctOptionIndex: 0,
    explanation:
      'Both O in H₂O and N in NH₃ have tetrahedral electron-pair geometry (sp³), but oxygen carries 2 lone pairs while nitrogen carries 1. Greater lone-pair repulsion compresses the H–O–H angle further.',
    hint: 'Count the lone pairs on the central atom in both molecules.',
    commonTrap: 'Thinking H₂O is sp² hybridised because its molecular shape is bent.',
    sourceType: 'demo_seed',
  },

  // Class 11 Maths — Limits
  {
    questionId: 'q_c11_math_1',
    conceptId: 'c11_math_calc_limits',
    chapterId: 'cbse_11_math_ch13',
    classLevel: '11',
    subject: 'Mathematics',
    difficultyLevel: 'standard',
    prompt: 'Evaluate lim(x→0) (sin 5x) / (3x).',
    options: ['5/3', '3/5', '1', '0'],
    correctOptionIndex: 0,
    explanation:
      'Rewrite as (5/3) · [sin(5x)/(5x)]. As x → 0, 5x → 0 and lim (sin u)/u = 1, yielding 5/3.',
    hint: 'Match the denominator to the argument inside sin(5x).',
    commonTrap: 'Assuming lim (sin 5x)/(3x) = 1 without scaling the denominator to 5x.',
    sourceType: 'demo_seed',
  },

  // Class 12 Physics — Electric Charges & Fields
  {
    questionId: 'q_c12_phy_1',
    conceptId: 'c12_phy_elec_gauss',
    chapterId: 'cbse_12_phy_ch1',
    classLevel: '12',
    subject: 'Physics',
    difficultyLevel: 'application',
    prompt: 'A point charge +q is placed at the centre of a spherical Gaussian surface of radius R. If the radius is doubled to 2R, how does the total electric flux through the surface change?',
    options: [
      'It remains unchanged (q / ε₀)',
      'It becomes one-fourth',
      'It doubles',
      'It becomes four times larger',
    ],
    correctOptionIndex: 0,
    explanation:
      'By Gauss’s Law, total flux Φ = q_enc / ε₀ depends solely on the enclosed charge, not on the radius or shape of the closed Gaussian surface.',
    hint: 'Recall Gauss’s Law: although E drops as 1/r², surface area grows as r².',
    commonTrap: 'Thinking flux decreases as 1/R² because electric field intensity E decreases with distance.',
    sourceType: 'demo_seed',
  },

  // Class 12 Chemistry — Electrochemistry
  {
    questionId: 'q_c12_chem_1',
    conceptId: 'c12_chem_echem_nernst',
    chapterId: 'cbse_12_chem_ch2',
    classLevel: '12',
    subject: 'Chemistry',
    difficultyLevel: 'application',
    prompt: 'For a galvanic cell at 298 K with n = 2 and E°_cell = +1.10 V, what happens to E_cell when the reaction quotient Q increases?',
    options: [
      'E_cell decreases',
      'E_cell increases',
      'E_cell stays fixed at +1.10 V',
      'E°_cell becomes zero',
    ],
    correctOptionIndex: 0,
    explanation:
      'From the Nernst equation E_cell = E°_cell - (0.059/n) log Q, increasing Q increases log Q, which subtracts a larger value from E°_cell and reduces E_cell.',
    hint: 'Inspect the sign in front of (0.059/n) log Q in the Nernst equation.',
    commonTrap: 'Forgetting the minus sign in the Nernst equation.',
    sourceType: 'demo_seed',
  },

  // Class 12 Maths — Integrals
  {
    questionId: 'q_c12_math_1',
    conceptId: 'c12_math_int_def',
    chapterId: 'cbse_12_math_ch7',
    classLevel: '12',
    subject: 'Mathematics',
    difficultyLevel: 'challenge',
    prompt: 'What is the value of ∫₀^(π/2) [sin x / (sin x + cos x)] dx?',
    options: ['π / 4', 'π / 2', '1', '0'],
    correctOptionIndex: 0,
    explanation:
      'Let I = ∫₀^(π/2) [sin x / (sin x + cos x)] dx. Applying King’s property x → π/2 - x gives I = ∫₀^(π/2) [cos x / (cos x + sin x)] dx. Adding gives 2I = ∫₀^(π/2) 1 dx = π/2 ⇒ I = π/4.',
    hint: 'Use the property ∫₀ᵃ f(x)dx = ∫₀ᵃ f(a - x)dx and add the two integrals.',
    commonTrap: 'Attempting direct algebraic substitution instead of exploiting symmetry.',
    sourceType: 'demo_seed',
  },
];

export function getAllConcepts() {
  return SEED_CHAPTERS.flatMap((ch) =>
    ch.concepts.map((c) => ({
      ...c,
      subject: ch.subject,
      classLevel: ch.classLevel,
      chapterTitle: ch.title,
    }))
  );
}

export function getChapterById(chapterId: string): CurriculumChapter | undefined {
  return SEED_CHAPTERS.find((c) => c.chapterId === chapterId);
}

export function getQuestionsForChapter(chapterId: string): QuestionItem[] {
  return SEED_QUESTIONS.filter((q) => q.chapterId === chapterId);
}

export function getQuestionsForConcept(conceptId: string): QuestionItem[] {
  return SEED_QUESTIONS.filter((q) => q.conceptId === conceptId);
}
