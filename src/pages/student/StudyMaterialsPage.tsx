import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  BookmarkPlus,
  BookOpen,
  FileText,
  Layers,
  Loader2,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SEED_CHAPTERS } from '../../data/curriculumSeed';
import { generateStudyMaterial } from '../../services/aiClient';
import type { MaterialType, SavedMaterial } from '../../types/mastery';

const MATERIAL_TYPES: { id: Exclude<MaterialType, 'tutor_note'>; label: string }[] = [
  { id: 'chapter_notes', label: 'Chapter Notes' },
  { id: 'summary', label: 'Short Summary' },
  { id: 'revision_notes', label: 'Revision Notes' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'formula_sheet', label: 'Formula Sheet' },
  { id: 'practice_questions', label: 'Practice Questions' },
  { id: 'concept_list', label: 'Important Concepts' },
];

export const StudyMaterialsPage: React.FC = () => {
  const { selectedContext, setSelectedContext, learnerModel, savedMaterials, saveStudyNote, removeStudyNote } =
    useApp();

  const activeChapter = useMemo(
    () => SEED_CHAPTERS.find((c) => c.chapterId === selectedContext.chapterId) ?? SEED_CHAPTERS[0],
    [selectedContext.chapterId]
  );

  const [materialType, setMaterialType] =
    useState<Exclude<MaterialType, 'tutor_note'>>('revision_notes');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generated, setGenerated] = useState<{
    title: string;
    overview: string;
    sections: { heading: string; bullets: string[] }[];
    flashcards?: { front: string; back: string }[];
    examTips: string[];
  } | null>(null);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [viewingSaved, setViewingSaved] = useState<SavedMaterial | null>(null);

  const weakConceptsInChapter = useMemo(
    () =>
      activeChapter.concepts
        .filter((c) => {
          const st = learnerModel[c.conceptId];
          return st && st.masteryScore < 70;
        })
        .map((c) => c.name),
    [activeChapter, learnerModel]
  );

  const handleGenerate = async () => {
    setLoading(true);
    setErrorMsg(null);
    setViewingSaved(null);
    setFlippedCards({});
    try {
      const res = await generateStudyMaterial({
        classLevel: activeChapter.classLevel,
        subject: activeChapter.subject,
        chapterTitle: activeChapter.title,
        topics: activeChapter.topics,
        materialType,
        focusWeakConcepts: weakConceptsInChapter,
      });
      setGenerated(res.data);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to generate study materials right now.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGenerated = async () => {
    if (!generated) return;
    const sectionsText = generated.sections
      .map((s) => `#### ${s.heading}\n${s.bullets.map((b) => `- ${b}`).join('\n')}`)
      .join('\n\n');
    const flashText =
      generated.flashcards && generated.flashcards.length > 0
        ? `\n\n#### Flashcards\n${generated.flashcards.map((f, i) => `${i + 1}. **Q:** ${f.front} — **A:** ${f.back}`).join('\n')}`
        : '';
    const tipsText =
      generated.examTips.length > 0
        ? `\n\n#### Exam Tips\n${generated.examTips.map((t) => `- ${t}`).join('\n')}`
        : '';

    await saveStudyNote({
      title: generated.title,
      materialType,
      classLevel: activeChapter.classLevel,
      subject: activeChapter.subject,
      chapterId: activeChapter.chapterId,
      content: `### ${generated.title}\n\n${generated.overview}\n\n${sectionsText}${flashText}${tipsText}`,
    });
  };

  return (
    <div className="grid lg:grid-cols-12 gap-6 items-start">
      {/* Left Generator + Output (8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        <section className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-6 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-[#283618] dark:text-[#FEFAE0]">
              AI Study-Material Studio
            </h2>
            <p className="text-xs text-[#606C38] dark:text-[#FEFAE0]/85 mt-0.5">
              Powered by Gemini 4 Hydrogen — automatically emphasizes your weak concepts from the Living Learner Model.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="mat-chapter" className="block text-xs font-semibold text-[#283618] dark:text-[#FEFAE0]/85 mb-1">
                CBSE Chapter
              </label>
              <select
                id="mat-chapter"
                value={activeChapter.chapterId}
                onChange={(e) => {
                  const ch = SEED_CHAPTERS.find((c) => c.chapterId === e.target.value) ?? activeChapter;
                  setSelectedContext({
                    classLevel: ch.classLevel,
                    subject: ch.subject,
                    chapterId: ch.chapterId,
                    conceptId: ch.concepts[0]?.conceptId,
                  });
                }}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] text-[#1C2412] dark:text-[#FEFAE0]"
              >
                {SEED_CHAPTERS.map((ch) => (
                  <option key={ch.chapterId} value={ch.chapterId}>
                    Class {ch.classLevel} · {ch.subject} · {ch.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl p-3 bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38] text-xs">
              <p className="font-semibold text-[#BC6C25] dark:text-[#DDA15E]">
                Personalization Focus
              </p>
              <p className="text-[#4A543B] dark:text-[#FEFAE0]/85 mt-1">
                {weakConceptsInChapter.length > 0
                  ? `Emphasizing weak areas: ${weakConceptsInChapter.join(', ')}`
                  : 'Balanced conceptual coverage across all chapter topics.'}
              </p>
            </div>
          </div>

          {/* Material Type Selector */}
          <div className="flex flex-wrap gap-2">
            {MATERIAL_TYPES.map((mt) => (
              <button
                key={mt.id}
                type="button"
                onClick={() => setMaterialType(mt.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                  materialType === mt.id
                    ? 'bg-[#606C38] text-white border-[#606C38]'
                    : 'bg-[#FEFAE0] dark:bg-[#283618] text-[#283618] dark:text-[#FEFAE0]/85 border-[#D8D3B4] dark:border-[#606C38]'
                }`}
              >
                {mt.label}
              </button>
            ))}
          </div>

          {errorMsg && (
            <div className="rounded-xl p-3.5 bg-[#DDA15E]/20 dark:bg-[#283618] border border-[#606C38] flex items-start gap-2 text-xs text-[#283618] dark:text-[#FEFAE0]">
              <AlertCircle className="w-4 h-4 text-[#606C38] dark:text-[#DDA15E] shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={() => void handleGenerate()}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#606C38] hover:bg-[#283618] disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating with Gemini 4 Hydrogen...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate {MATERIAL_TYPES.find((m) => m.id === materialType)?.label}
              </>
            )}
          </button>
        </section>

        {/* Generated Material Preview */}
        {generated && !viewingSaved && (
          <section className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#E5E0C5] dark:border-[#606C38]">
              <div>
                <p className="text-xs font-semibold text-[#BC6C25] dark:text-[#DDA15E]">
                  Class {activeChapter.classLevel} · {activeChapter.subject} · AI Generated Study Aid
                </p>
                <h3 className="text-xl font-bold text-[#283618] dark:text-[#FEFAE0] mt-1">
                  {generated.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => void handleSaveGenerated()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#606C38] hover:bg-[#283618] text-white text-xs font-semibold cursor-pointer"
              >
                <BookmarkPlus className="w-4 h-4" />
                Save to Library
              </button>
            </div>

            <p className="text-sm text-[#4A543B] dark:text-[#FEFAE0]/85 leading-relaxed">
              {generated.overview}
            </p>

            {/* Interactive Flashcards */}
            {generated.flashcards && generated.flashcards.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-sm font-bold text-[#283618] dark:text-[#FEFAE0] inline-flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#BC6C25]" />
                  Interactive Flashcards (Click to flip)
                </h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  {generated.flashcards.map((card, idx) => {
                    const flipped = Boolean(flippedCards[idx]);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setFlippedCards((prev) => ({ ...prev, [idx]: !prev[idx] }))
                        }
                        className={`text-left rounded-2xl p-4 min-h-[110px] border transition-colors cursor-pointer ${
                          flipped
                            ? 'bg-[#606C38] text-white border-[#606C38]'
                            : 'bg-[#FEFAE0] dark:bg-[#283618] border-[#D8D3B4] dark:border-[#606C38] text-[#283618] dark:text-[#FEFAE0]'
                        }`}
                      >
                        <p className="text-[11px] font-bold opacity-80 mb-1.5">
                          {flipped ? 'Answer' : `Card ${idx + 1} · Prompt`}
                        </p>
                        <p className="text-xs leading-relaxed font-medium">
                          {flipped ? card.back : card.front}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Structured Sections */}
            <div className="space-y-4">
              {generated.sections.map((sec) => (
                <div
                  key={sec.heading}
                  className="rounded-2xl p-4 bg-[#FEFAE0] dark:bg-[#283618] border border-[#D8D3B4] dark:border-[#606C38]"
                >
                  <h4 className="text-sm font-bold text-[#283618] dark:text-[#FEFAE0] mb-2">
                    {sec.heading}
                  </h4>
                  <ul className="space-y-1.5 text-xs text-[#4A543B] dark:text-[#FEFAE0]/85 list-disc pl-4">
                    {sec.bullets.map((b, i) => (
                      <li key={i} className="leading-relaxed">
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {generated.examTips.length > 0 && (
              <div className="rounded-2xl p-4 bg-[#DDA15E]/20 dark:bg-[#606C38] border border-[#D8D3B4] dark:border-[#DDA15E]/60">
                <h4 className="text-xs font-bold text-[#BC6C25] dark:text-[#DDA15E] mb-1.5">
                  Exam Presentation Tips
                </h4>
                <ul className="space-y-1 text-xs text-[#283618] dark:text-[#FEFAE0] list-disc pl-4">
                  {generated.examTips.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Saved Material Viewer */}
        {viewingSaved && (
          <section className="rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-6 space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E5E0C5] dark:border-[#606C38]">
              <div>
                <p className="text-xs font-semibold text-[#BC6C25] dark:text-[#DDA15E] capitalize">
                  Class {viewingSaved.classLevel} · {viewingSaved.subject} · {viewingSaved.materialType.replace('_', ' ')}
                </p>
                <h3 className="text-lg font-bold text-[#283618] dark:text-[#FEFAE0] mt-1">
                  {viewingSaved.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingSaved(null)}
                className="text-xs font-semibold text-[#606C38] dark:text-[#DDA15E] hover:underline cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="whitespace-pre-wrap text-sm text-[#1C2412] dark:text-[#FEFAE0] leading-relaxed font-sans">
              {viewingSaved.content}
            </div>
          </section>
        )}
      </div>

      {/* Right Saved Materials Library (4 cols) */}
      <aside className="lg:col-span-4 rounded-[20px] bg-white dark:bg-[#334220] border border-[#D8D3B4] dark:border-[#606C38] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#283618] dark:text-[#FEFAE0]">
              Saved Library
            </h3>
            <p className="text-xs text-[#606C38] dark:text-[#FEFAE0]/85">
              {savedMaterials.length} saved study items
            </p>
          </div>
          <BookOpen className="w-4 h-4 text-[#BC6C25]" />
        </div>

        {savedMaterials.length === 0 ? (
          <p className="text-xs text-[#606C38] dark:text-[#FEFAE0]/85 py-6 text-center">
            Save AI Tutor explanations or generated notes to revisit them anytime.
          </p>
        ) : (
          <div className="space-y-2.5">
            {savedMaterials.map((item) => (
              <div
                key={item.itemId}
                className={`rounded-xl p-3.5 border transition-colors ${
                  viewingSaved?.itemId === item.itemId
                    ? 'bg-[#606C38] text-white border-[#606C38]'
                    : 'bg-[#FEFAE0] dark:bg-[#283618] border-[#D8D3B4] dark:border-[#606C38]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setViewingSaved(item)}
                    className="text-left flex-1 min-w-0 cursor-pointer"
                  >
                    <p
                      className={`text-[11px] font-semibold capitalize ${
                        viewingSaved?.itemId === item.itemId
                          ? 'text-[#FEFAE0]/85'
                          : 'text-[#BC6C25] dark:text-[#DDA15E]'
                      }`}
                    >
                      {item.subject} · {item.materialType.replace('_', ' ')}
                    </p>
                    <p
                      className={`text-xs font-bold mt-0.5 line-clamp-2 ${
                        viewingSaved?.itemId === item.itemId
                          ? 'text-white'
                          : 'text-[#283618] dark:text-[#FEFAE0]'
                      }`}
                    >
                      {item.title}
                    </p>
                  </button>
                  <button
                    type="button"
                    aria-label="Delete saved material"
                    onClick={() => {
                      if (viewingSaved?.itemId === item.itemId) setViewingSaved(null);
                      void removeStudyNote(item.itemId);
                    }}
                    className={`p-1.5 rounded-lg cursor-pointer shrink-0 ${
                      viewingSaved?.itemId === item.itemId
                        ? 'text-white/80 hover:bg-white/15'
                        : 'text-[#606C38] dark:text-[#DDA15E] hover:bg-[#DDA15E]/20 dark:hover:bg-[#606C38]'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
};
