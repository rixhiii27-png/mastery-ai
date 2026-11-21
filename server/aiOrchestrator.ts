import { ThinkingLevel, Type } from '@google/genai';
import { z } from 'zod';
import { invokeGeminiJson } from './aiConfig.js';

/**
 * Six Logical AI Agents Orchestrated Over One Gemini 4 Hydrogen Layer:
 * 1. Tutor Agent
 * 2. Assessment Agent
 * 3. Diagnostic Agent
 * 4. Adaptive Learning Agent
 * 5. Revision Agent
 * 6. Analytics Agent
 * + Study Material Generator
 */

const BASE_PEDAGOGY_GUARDRAILS = `
You are part of MASTERY AI, an adaptive CBSE Classes 10-12 learning platform.
Strict pedagogical & integrity rules:
- Act like a patient, encouraging subject teacher—never a generic chatbot.
- Do NOT invent official CBSE textbook page numbers, exercise numbers, or claim unverified facts come from official NCERT/CBSE publications.
- Never claim generated questions are official previous-year CBSE board questions.
- Never assign or overwrite numeric mastery scores (mastery is computed deterministically by the application engine).
- Keep explanations crisp, accurate, and age-appropriate for the specified CBSE class level.
`;

// ---------------------------------------------------------------------------
// 1. TUTOR AGENT
// ---------------------------------------------------------------------------
const tutorResponseValidator = z.object({
  directAnswer: z.string().min(1),
  steps: z
    .array(
      z.object({
        title: z.string().min(1),
        detail: z.string().min(1),
      })
    )
    .min(1)
    .max(6),
  realWorldExample: z.string().min(1),
  hintFirstPrompt: z.string().optional(),
  followUpQuestions: z.array(z.string().min(1)).min(1).max(4),
  quickPracticeQuestion: z
    .object({
      prompt: z.string().min(1),
      options: z.array(z.string().min(1)).length(4),
      correctIndex: z.number().int().min(0).max(3),
      explanation: z.string().min(1),
    })
    .optional(),
  curriculumNote: z.string().min(1),
});

export async function runTutorAgent(input: {
  question: string;
  classLevel: string;
  subject: string;
  chapterTitle: string;
  conceptName?: string;
  lessonTitle?: string;
  lessonDescription?: string;
  lessonTopics?: string[];
  lessonObjectives?: string[];
  mode: 'beginner' | 'simple' | 'detailed' | 'exam_prep';
  hintFirst: boolean;
  includePractice: boolean;
  learnerContext?: {
    masteryScore?: number;
    potentialMisconception?: string;
    difficultyLevel?: string;
  };
  history?: { role: 'student' | 'tutor'; text: string }[];
}) {
  const modeGuidance: Record<typeof input.mode, string> = {
    beginner: 'Use foundational intuition from scratch, avoid jargon, and explain every single symbol.',
    simple: 'Give a clear, friendly, concise explanation using everyday language and short steps.',
    detailed: 'Provide thorough conceptual derivations, formal definitions, edge cases, and precision.',
    exam_prep: 'Focus on CBSE board-exam presentation, key formula steps, marking-scheme clarity, and common traps to avoid.',
  };

  const recentHistory = (input.history ?? [])
    .slice(-4)
    .map((m) => `${m.role === 'student' ? 'Student' : 'Tutor'}: ${m.text.slice(0, 400)}`)
    .join('\n');

  const learnerNote = input.learnerContext
    ? `Student Living Learner Model context: current mastery=${input.learnerContext.masteryScore ?? 'unknown'}%, difficulty=${input.learnerContext.difficultyLevel ?? 'standard'}, misconception hypothesis="${input.learnerContext.potentialMisconception || 'none'}".`
    : 'No prior mastery record for this concept yet.';

  const boundedLessonBlock = input.lessonTitle
    ? `
Bounded Active Lesson Metadata (Session 2026-27):
- Lesson: ${input.lessonTitle}
- Description: ${input.lessonDescription || 'N/A'}
- Key Topics: ${(input.lessonTopics ?? []).join(', ') || 'N/A'}
- Learning Objectives: ${(input.lessonObjectives ?? []).join('; ') || 'N/A'}`
    : '';

  const userPrompt = `
Context:
- CBSE Class ${input.classLevel} (Session 2026-27) | Subject: ${input.subject} | Chapter: ${input.chapterTitle}${input.conceptName ? ` | Concept: ${input.conceptName}` : ''}${boundedLessonBlock}
- Explanation Mode: ${input.mode} (${modeGuidance[input.mode]})
- Hint-First Mode: ${input.hintFirst ? 'ON — give a guiding Socratic hint first in hintFirstPrompt before the full solution steps, and keep directAnswer encouraging and scaffolded.' : 'OFF — explain directly and clearly.'}
- Include Quick Practice Question: ${input.includePractice ? 'YES — provide a 4-option conceptual MCQ in quickPracticeQuestion.' : 'OPTIONAL.'}
- Off-chapter flexibility: If the student asks a question outside the active chapter/lesson, answer their actual question accurately and naturally without forcing it into the active chapter, and note the topic alignment briefly in curriculumNote.
- ${learnerNote}

Recent conversation:
${recentHistory || 'None'}

Student question:
${input.question}
`;

  return invokeGeminiJson({
    systemInstruction: `${BASE_PEDAGOGY_GUARDRAILS}\nReturn structured JSON matching the schema.`,
    userPrompt,
    validator: tutorResponseValidator,
    thinkingLevel: ThinkingLevel.LOW,
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        directAnswer: { type: Type.STRING, description: 'Clear concise core explanation.' },
        steps: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              detail: { type: Type.STRING },
            },
            required: ['title', 'detail'],
          },
          description: '2 to 5 structured step-by-step teaching cards.',
        },
        realWorldExample: { type: Type.STRING, description: 'Relatable real-world analogy or application.' },
        hintFirstPrompt: { type: Type.STRING, description: 'Guiding hint if hint-first learning is active.' },
        followUpQuestions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '2-3 suggested follow-up doubts the student can click next.',
        },
        quickPracticeQuestion: {
          type: Type.OBJECT,
          properties: {
            prompt: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING },
          },
          required: ['prompt', 'options', 'correctIndex', 'explanation'],
        },
        curriculumNote: {
          type: Type.STRING,
          description: 'Brief transparent note on alignment with CBSE conceptual scope without fabricating official citations.',
        },
      },
      required: ['directAnswer', 'steps', 'realWorldExample', 'followUpQuestions', 'curriculumNote'],
    },
  });
}

// ---------------------------------------------------------------------------
// 2. ASSESSMENT AGENT (Generate calibrated MCQ questions)
// ---------------------------------------------------------------------------
const generatedQuestionsValidator = z.object({
  questions: z
    .array(
      z.object({
        prompt: z.string().min(8),
        options: z.array(z.string().min(1)).length(4),
        correctOptionIndex: z.number().int().min(0).max(3),
        explanation: z.string().min(8),
        hint: z.string().min(4),
        commonTrap: z.string().min(4),
      })
    )
    .min(1)
    .max(5),
});

export async function runAssessmentAgent(input: {
  classLevel: string;
  subject: string;
  chapterTitle: string;
  conceptName: string;
  conceptId: string;
  chapterId: string;
  difficultyLevel: 'foundational' | 'standard' | 'application' | 'challenge';
  count: number;
  focusMisconception?: string;
}) {
  const safeCount = Math.max(1, Math.min(4, input.count));
  const userPrompt = `
Generate ${safeCount} original, mathematically/scientifically verified multiple-choice practice question(s) for:
- CBSE Class ${input.classLevel} | ${input.subject} | Chapter: ${input.chapterTitle}
- Concept: ${input.conceptName}
- Target Difficulty: ${input.difficultyLevel}
- Optional misconception to probe gently: ${input.focusMisconception || 'None'}

Requirements:
- Exactly 4 unambiguous options per question, with exactly 1 unambiguously correct answer.
- Double-check all arithmetic and units before outputting.
- Do NOT claim these are official past CBSE exam papers.
`;

  const raw = await invokeGeminiJson({
    systemInstruction: `${BASE_PEDAGOGY_GUARDRAILS}\nGenerate accurate, checked MCQ questions in JSON.`,
    userPrompt,
    validator: generatedQuestionsValidator,
    thinkingLevel: ThinkingLevel.LOW,
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        questions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              prompt: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctOptionIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
              hint: { type: Type.STRING },
              commonTrap: { type: Type.STRING },
            },
            required: ['prompt', 'options', 'correctOptionIndex', 'explanation', 'hint', 'commonTrap'],
          },
        },
      },
      required: ['questions'],
    },
  });

  const ts = Date.now();
  return raw.questions.map((q, idx) => ({
    questionId: `ai_q_${ts}_${idx}`,
    conceptId: input.conceptId,
    chapterId: input.chapterId,
    classLevel: input.classLevel as '10' | '11' | '12',
    subject: input.subject,
    difficultyLevel: input.difficultyLevel,
    prompt: q.prompt,
    options: q.options,
    correctOptionIndex: q.correctOptionIndex,
    explanation: q.explanation,
    hint: q.hint,
    commonTrap: q.commonTrap,
    sourceType: 'ai_generated' as const,
  }));
}

// ---------------------------------------------------------------------------
// 3. DIAGNOSTIC AGENT (Misconception hypothesis reasoning)
// ---------------------------------------------------------------------------
const diagnosticValidator = z.object({
  hypotheses: z.array(
    z.object({
      conceptId: z.string().min(1),
      conceptName: z.string().min(1),
      hypothesis: z.string().min(5),
      confidence: z.number().min(0.1).max(0.95),
      remediationTip: z.string().min(5),
      prerequisiteToReview: z.string().min(2),
    })
  ),
  overallEncouragement: z.string().min(5),
  recommendedNextStep: z.string().min(5),
});

export async function runDiagnosticAgent(input: {
  classLevel: string;
  subject: string;
  chapterTitle: string;
  incorrectItems: {
    conceptId: string;
    conceptName: string;
    questionPrompt: string;
    chosenOption: string;
    correctOption: string;
    studentNote?: string;
  }[];
}) {
  const userPrompt = `
Analyze the student's incorrect responses from a CBSE Class ${input.classLevel} ${input.subject} (${input.chapterTitle}) diagnostic:
${JSON.stringify(input.incorrectItems, null, 2)}

Rules:
- Frame every misconception as a testable hypothesis (e.g., "Possible confusion between..."), never as an absolute diagnosis.
- Keep confidence calibrated (0.35–0.85 depending on how specific the distractor error is).
- Suggest a concrete prerequisite to review and a short remediation tip.
- Do NOT output mastery scores.
`;

  return invokeGeminiJson({
    systemInstruction: `${BASE_PEDAGOGY_GUARDRAILS}\nYou are the Diagnostic Agent proposing evidence-based misconception hypotheses.`,
    userPrompt,
    validator: diagnosticValidator,
    thinkingLevel: ThinkingLevel.LOW,
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        hypotheses: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              conceptId: { type: Type.STRING },
              conceptName: { type: Type.STRING },
              hypothesis: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              remediationTip: { type: Type.STRING },
              prerequisiteToReview: { type: Type.STRING },
            },
            required: ['conceptId', 'conceptName', 'hypothesis', 'confidence', 'remediationTip', 'prerequisiteToReview'],
          },
        },
        overallEncouragement: { type: Type.STRING },
        recommendedNextStep: { type: Type.STRING },
      },
      required: ['hypotheses', 'overallEncouragement', 'recommendedNextStep'],
    },
  });
}

// ---------------------------------------------------------------------------
// 4. ADAPTIVE LEARNING AGENT
// ---------------------------------------------------------------------------
const adaptiveValidator = z.object({
  recommendedConceptId: z.string().min(1),
  recommendedAction: z.string().min(5),
  difficultyGuidance: z.string().min(5),
  simplerAnalogy: z.string().min(5),
  prerequisiteCheck: z.string().min(3),
});

export async function runAdaptiveAgent(input: {
  classLevel: string;
  conceptsSummary: {
    conceptId: string;
    conceptName: string;
    subject: string;
    masteryScore: number;
    difficultyLevel: string;
    potentialMisconception: string;
  }[];
}) {
  const userPrompt = `
Given this student's deterministic Living Learner Model for CBSE Class ${input.classLevel}:
${JSON.stringify(input.conceptsSummary, null, 2)}

Recommend the single highest-impact next learning action, choosing one existing conceptId from the list above.
`;

  return invokeGeminiJson({
    systemInstruction: `${BASE_PEDAGOGY_GUARDRAILS}\nYou are the Adaptive Learning Agent.`,
    userPrompt,
    validator: adaptiveValidator,
    thinkingLevel: ThinkingLevel.LOW,
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        recommendedConceptId: { type: Type.STRING },
        recommendedAction: { type: Type.STRING },
        difficultyGuidance: { type: Type.STRING },
        simplerAnalogy: { type: Type.STRING },
        prerequisiteCheck: { type: Type.STRING },
      },
      required: ['recommendedConceptId', 'recommendedAction', 'difficultyGuidance', 'simplerAnalogy', 'prerequisiteCheck'],
    },
  });
}

// ---------------------------------------------------------------------------
// 5. REVISION AGENT (Never invents dates — augments deterministic schedule)
// ---------------------------------------------------------------------------
const revisionValidator = z.object({
  studyStrategy: z.string().min(5),
  recallPrompts: z.array(
    z.object({
      conceptName: z.string().min(1),
      quickRecallQuestion: z.string().min(5),
      keyCheckpoints: z.string().min(5),
    })
  ),
});

export async function runRevisionAgent(input: {
  classLevel: string;
  dueItems: {
    conceptName: string;
    subject: string;
    dueDate: string;
    priority: string;
    reason: string;
  }[];
}) {
  const userPrompt = `
The deterministic spaced-repetition scheduler has selected these revision items for a CBSE Class ${input.classLevel} student:
${JSON.stringify(input.dueItems, null, 2)}

Do NOT change or invent revision dates. Instead, provide a concise 15-minute active-recall strategy and 1 quick recall prompt per due concept.
`;

  return invokeGeminiJson({
    systemInstruction: `${BASE_PEDAGOGY_GUARDRAILS}\nYou are the Revision Agent.`,
    userPrompt,
    validator: revisionValidator,
    thinkingLevel: ThinkingLevel.LOW,
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        studyStrategy: { type: Type.STRING },
        recallPrompts: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              conceptName: { type: Type.STRING },
              quickRecallQuestion: { type: Type.STRING },
              keyCheckpoints: { type: Type.STRING },
            },
            required: ['conceptName', 'quickRecallQuestion', 'keyCheckpoints'],
          },
        },
      },
      required: ['studyStrategy', 'recallPrompts'],
    },
  });
}

// ---------------------------------------------------------------------------
// 6. ANALYTICS AGENT (Role-scoped summaries only)
// ---------------------------------------------------------------------------
const analyticsValidator = z.object({
  headline: z.string().min(5),
  strengths: z.array(z.string().min(3)).min(1).max(4),
  priorityGaps: z.array(z.string().min(3)).min(1).max(4),
  actionablePlan: z.array(z.string().min(3)).min(1).max(4),
});

export async function runAnalyticsAgent(input: {
  role: 'student' | 'teacher' | 'parent';
  authorizedMetrics: Record<string, unknown>;
}) {
  const userPrompt = `
Generate a concise, grounded learning analytics brief for role="${input.role}" using ONLY the authorized metrics below (never invent unseen metrics or private chat content):
${JSON.stringify(input.authorizedMetrics, null, 2)}
`;

  return invokeGeminiJson({
    systemInstruction: `${BASE_PEDAGOGY_GUARDRAILS}\nYou are the Analytics Agent summarizing authorized progress data.`,
    userPrompt,
    validator: analyticsValidator,
    thinkingLevel: ThinkingLevel.LOW,
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        headline: { type: Type.STRING },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        priorityGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
        actionablePlan: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['headline', 'strengths', 'priorityGaps', 'actionablePlan'],
    },
  });
}

// ---------------------------------------------------------------------------
// 7. STUDY MATERIAL GENERATOR
// ---------------------------------------------------------------------------
const materialValidator = z.object({
  title: z.string().min(3),
  overview: z.string().min(10),
  sections: z
    .array(
      z.object({
        heading: z.string().min(2),
        bullets: z.array(z.string().min(2)).min(1).max(8),
      })
    )
    .min(1)
    .max(8),
  flashcards: z
    .array(
      z.object({
        front: z.string().min(2),
        back: z.string().min(2),
      })
    )
    .optional(),
  examTips: z.array(z.string().min(3)).max(4),
});

export async function runStudyMaterialGenerator(input: {
  classLevel: string;
  subject: string;
  chapterTitle: string;
  topics: string[];
  materialType:
    | 'chapter_notes'
    | 'summary'
    | 'revision_notes'
    | 'flashcards'
    | 'formula_sheet'
    | 'practice_questions'
    | 'concept_list';
  focusWeakConcepts?: string[];
}) {
  const userPrompt = `
Create structured "${input.materialType}" study material for:
- CBSE Class ${input.classLevel} | ${input.subject} | Chapter: ${input.chapterTitle}
- Key Topics: ${input.topics.join(', ')}
- Student weak concepts to emphasize: ${(input.focusWeakConcepts ?? []).join(', ') || 'General balanced coverage'}

If materialType is "flashcards", include 5-6 crisp flashcards in the flashcards array.
Keep explanations clear, structured, and accurate without fabricating NCERT page references.
`;

  return invokeGeminiJson({
    systemInstruction: `${BASE_PEDAGOGY_GUARDRAILS}\nGenerate crisp, student-ready CBSE study materials in JSON.`,
    userPrompt,
    validator: materialValidator,
    thinkingLevel: ThinkingLevel.LOW,
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        overview: { type: Type.STRING },
        sections: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              heading: { type: Type.STRING },
              bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['heading', 'bullets'],
          },
        },
        flashcards: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              front: { type: Type.STRING },
              back: { type: Type.STRING },
            },
            required: ['front', 'back'],
          },
        },
        examTips: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['title', 'overview', 'sections', 'examTips'],
    },
  });
}

// ---------------------------------------------------------------------------
// 8. ORIGINAL LESSON CONTENT GENERATOR (Strictly separated from official syllabus)
// ---------------------------------------------------------------------------
const lessonContentValidator = z.object({
  introduction: z.string().min(15),
  detailedExplanation: z
    .array(
      z.object({
        heading: z.string().min(2),
        body: z.string().min(15),
      })
    )
    .min(2)
    .max(5),
  keyConcepts: z
    .array(
      z.object({
        name: z.string().min(2),
        definition: z.string().min(8),
        importance: z.string().min(5),
      })
    )
    .min(2)
    .max(6),
  examples: z
    .array(
      z.object({
        title: z.string().min(2),
        scenario: z.string().min(8),
        explanation: z.string().min(8),
      })
    )
    .min(1)
    .max(3),
  workedExamples: z
    .array(
      z.object({
        problem: z.string().min(6),
        steps: z.array(z.string().min(3)).min(2).max(6),
        finalAnswer: z.string().min(2),
      })
    )
    .min(1)
    .max(3),
  formulas: z
    .array(
      z.object({
        name: z.string().min(2),
        expression: z.string().min(1),
        whenToUse: z.string().min(4),
      })
    )
    .max(6),
  misconceptions: z
    .array(
      z.object({
        myth: z.string().min(4),
        correction: z.string().min(6),
      })
    )
    .min(1)
    .max(4),
  revisionSummary: z.array(z.string().min(5)).min(3).max(7),
  knowledgeCheck: z
    .array(
      z.object({
        conceptName: z.string().min(2),
        prompt: z.string().min(8),
        options: z.array(z.string().min(1)).length(4),
        correctOptionIndex: z.number().int().min(0).max(3),
        explanation: z.string().min(8),
      })
    )
    .min(2)
    .max(4),
  practiceQuestions: z
    .array(
      z.object({
        difficulty: z.enum(['easy', 'medium', 'hard']),
        prompt: z.string().min(8),
        hint: z.string().min(4),
        modelAnswer: z.string().min(8),
      })
    )
    .min(3)
    .max(4),
});

export async function runLessonContentGenerator(input: {
  lessonId: string;
  classLevel: string;
  subject: string;
  chapterName: string;
  lessonTitle: string;
  lessonType: string;
  lessonDescription: string;
  topics: string[];
  concepts: string[];
  learningObjectives: string[];
}) {
  const userPrompt = `
Generate ORIGINAL, student-friendly, pedagogically rigorous learning material for this CBSE Class ${input.classLevel} (Session 2026-27) lesson:
- Subject: ${input.subject}
- Chapter: ${input.chapterName}
- Lesson Title: ${input.lessonTitle}
- Lesson Type: ${input.lessonType}
- Syllabus Scope: ${input.lessonDescription}
- Topics: ${input.topics.join(', ')}
- Core Concepts: ${input.concepts.join(', ')}
- Learning Objectives: ${input.learningObjectives.join('; ')}

Strict Integrity Requirements:
- Write 100% ORIGINAL instructional explanations, worked examples, and questions. Do NOT copy NCERT/CBSE textbook prose or invent page numbers.
- Tailor the pedagogy to lessonType="${input.lessonType}" (e.g., step-by-step calculations for numerical, literary analysis & textual technique for literature, case reasoning for case_study, practical lab/code workflow for practical/skill_based, primary-source chronology for historical).
- If the subject has no mathematical formulas (e.g., Literature or History), return key rules/frameworks/dates in "formulas" or an empty array.
- Include exactly 3 verified knowledgeCheck MCQs (each with 4 unambiguous options and 1 unambiguously correct index) and 3 practiceQuestions spanning easy, medium, and hard.
`;

  const raw = await invokeGeminiJson({
    systemInstruction: `${BASE_PEDAGOGY_GUARDRAILS}\nGenerate original, verified CBSE lesson study material in structured JSON.`,
    userPrompt,
    validator: lessonContentValidator,
    thinkingLevel: ThinkingLevel.LOW,
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        introduction: { type: Type.STRING },
        detailedExplanation: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              heading: { type: Type.STRING },
              body: { type: Type.STRING },
            },
            required: ['heading', 'body'],
          },
        },
        keyConcepts: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              definition: { type: Type.STRING },
              importance: { type: Type.STRING },
            },
            required: ['name', 'definition', 'importance'],
          },
        },
        examples: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              scenario: { type: Type.STRING },
              explanation: { type: Type.STRING },
            },
            required: ['title', 'scenario', 'explanation'],
          },
        },
        workedExamples: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              problem: { type: Type.STRING },
              steps: { type: Type.ARRAY, items: { type: Type.STRING } },
              finalAnswer: { type: Type.STRING },
            },
            required: ['problem', 'steps', 'finalAnswer'],
          },
        },
        formulas: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              expression: { type: Type.STRING },
              whenToUse: { type: Type.STRING },
            },
            required: ['name', 'expression', 'whenToUse'],
          },
        },
        misconceptions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              myth: { type: Type.STRING },
              correction: { type: Type.STRING },
            },
            required: ['myth', 'correction'],
          },
        },
        revisionSummary: { type: Type.ARRAY, items: { type: Type.STRING } },
        knowledgeCheck: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              conceptName: { type: Type.STRING },
              prompt: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctOptionIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
            },
            required: ['conceptName', 'prompt', 'options', 'correctOptionIndex', 'explanation'],
          },
        },
        practiceQuestions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              difficulty: { type: Type.STRING },
              prompt: { type: Type.STRING },
              hint: { type: Type.STRING },
              modelAnswer: { type: Type.STRING },
            },
            required: ['difficulty', 'prompt', 'hint', 'modelAnswer'],
          },
        },
      },
      required: [
        'introduction',
        'detailedExplanation',
        'keyConcepts',
        'examples',
        'workedExamples',
        'formulas',
        'misconceptions',
        'revisionSummary',
        'knowledgeCheck',
        'practiceQuestions',
      ],
    },
  });

  return {
    lessonId: input.lessonId,
    contentOrigin: 'ai_generated_original' as const,
    contentDisclaimer:
      'Original AI-authored explanation aligned to official CBSE 2026-27 syllabus metadata (not verbatim NCERT/CBSE textbook text).',
    ...raw,
    knowledgeCheck: raw.knowledgeCheck.map((q, idx) => ({
      questionId: `kc_${input.lessonId}_${idx + 1}`,
      ...q,
    })),
    generatedAt: new Date().toISOString(),
    modelUsed: 'gemini-4-hydrogen',
  };
}

// ---------------------------------------------------------------------------
// 9. LESSON-BASED AI ACTION AGENT (10 focused learning actions)
// ---------------------------------------------------------------------------
const lessonActionValidator = z.object({
  title: z.string().min(3),
  summary: z.string().min(10),
  blocks: z
    .array(
      z.object({
        heading: z.string().min(2),
        points: z.array(z.string().min(2)).min(1).max(6),
      })
    )
    .min(1)
    .max(5),
  quickTip: z.string().min(4),
});

export async function runLessonActionAgent(input: {
  action:
    | 'explain_lesson'
    | 'explain_difficult_concept'
    | 'simple_example'
    | 'detailed_explanation'
    | 'generate_notes'
    | 'generate_flashcards'
    | 'practice_questions'
    | 'test_understanding'
    | 'explain_mistake'
    | 'revision_summary';
  classLevel: string;
  subject: string;
  chapterName: string;
  lessonTitle: string;
  lessonType: string;
  topics: string[];
  concepts: string[];
  studentInput?: string;
}) {
  const actionInstructions: Record<typeof input.action, string> = {
    explain_lesson: 'Provide a clear, intuitive walkthrough of this entire lesson from first principles.',
    explain_difficult_concept: 'Pinpoint the single trickiest concept in this lesson and break it down simply.',
    simple_example: 'Provide 2 crystal-clear everyday analogies and worked mini-examples.',
    detailed_explanation: 'Deliver an in-depth CBSE board-ready conceptual explanation with formal reasoning.',
    generate_notes: 'Create crisp bulleted study notes organized by topic with definitions and key rules.',
    generate_flashcards: 'Provide 5 Q&A flashcard pairs formatted as Question -> Concise Answer.',
    practice_questions: 'Create 3 graduated practice questions (easy, medium, challenge) with hints and brief answers.',
    test_understanding: 'Create 3 quick diagnostic check-in prompts that expose common student misconceptions.',
    explain_mistake: 'Address common errors or the student mistake below and show the exact correction step by step.',
    revision_summary: 'Condense the entire lesson into a 2-minute high-yield pre-exam revision sheet.',
  };

  const userPrompt = `
Lesson Action: "${input.action}" — ${actionInstructions[input.action]}
Context:
- CBSE Class ${input.classLevel} (2026-27) | ${input.subject} | Chapter: ${input.chapterName}
- Lesson: ${input.lessonTitle} (Type: ${input.lessonType})
- Topics: ${input.topics.join(', ')}
- Concepts: ${input.concepts.join(', ')}
${input.studentInput ? `- Student focus / mistake note: ${input.studentInput}` : ''}
`;

  return invokeGeminiJson({
    systemInstruction: `${BASE_PEDAGOGY_GUARDRAILS}\nExecute the requested lesson learning action cleanly in structured JSON.`,
    userPrompt,
    validator: lessonActionValidator,
    thinkingLevel: ThinkingLevel.LOW,
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        summary: { type: Type.STRING },
        blocks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              heading: { type: Type.STRING },
              points: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['heading', 'points'],
          },
        },
        quickTip: { type: Type.STRING },
      },
      required: ['title', 'summary', 'blocks', 'quickTip'],
    },
  });
}

