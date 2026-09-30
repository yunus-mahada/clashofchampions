import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Check } from 'lucide-react';
import { Question } from '../types/game';
import { Timer } from './Timer';
import { ComboDisplay } from './ComboDisplay';
import { MultipleChoice } from './MultipleChoice';
import { TrueFalse } from './TrueFalse';
import { ArrangeQuestion } from './ArrangeQuestion';
import { FillBlank } from './FillBlank';
import { QuestionFeedback } from './QuestionFeedback';

interface QuestionScreenProps {
  question: Question;
  combo: number;
  isPaused: boolean;
  isAnswered: boolean;
  blindMode?: boolean;
  feedbackData?: {
    isCorrect: boolean;
    pointsEarned: number;
    baseScore: number;
    multiplier: number;
  } | null;
  onAnswer: (isCorrect: boolean, timeTaken: number, userAnswer: string | string[]) => void;
  onNext: () => void;
}

export const QuestionScreen: React.FC<QuestionScreenProps> = ({
  question,
  combo,
  isPaused,
  isAnswered,
  blindMode = false,
  feedbackData,
  onAnswer,
  onNext,
}) => {
  const [timeTaken, setTimeTaken] = useState<number>(0);

  const handleTimerTick = (timeLeft: number) => {
    setTimeTaken(30 - timeLeft);
  };

  const handleTimerExpire = () => {
    if (isAnswered) return;
    onAnswer(false, 30, 'Waktu Habis');
  };

  const handleMultipleChoiceSelect = (selected: string) => {
    if (isAnswered) return;
    const isCorrect = selected.trim().toLowerCase() === String(question.correctAnswer).trim().toLowerCase();
    onAnswer(isCorrect, timeTaken, selected);
  };

  const handleTrueFalseSelect = (selected: 'BENAR' | 'SALAH') => {
    if (isAnswered) return;
    const isCorrect = selected === question.correctAnswer;
    onAnswer(isCorrect, timeTaken, selected);
  };

  const handleArrangeSubmit = (arranged: string[]) => {
    if (isAnswered) return;
    const expected = question.correctAnswer as string[];
    const isCorrect =
      arranged.length === expected.length &&
      arranged.every((val, idx) => val.trim().toLowerCase() === expected[idx].trim().toLowerCase());
    onAnswer(isCorrect, timeTaken, arranged);
  };

  const handleFillBlankSubmit = (selectedWord: string) => {
    if (isAnswered) return;
    const isCorrect = selectedWord.trim().toLowerCase() === String(question.correctAnswer).trim().toLowerCase();
    onAnswer(isCorrect, timeTaken, selectedWord);
  };

  return (
    <div className="flex-1 flex flex-col justify-between w-full max-w-lg mx-auto p-4 relative overflow-y-auto no-scrollbar">
      {/* Top row: Timer & Combo */}
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                question.difficulty === 'hard'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : question.difficulty === 'medium'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {blindMode
                ? question.difficulty === 'hard'
                  ? 'Tingkat Sulit'
                  : question.difficulty === 'medium'
                  ? 'Tingkat Sedang'
                  : 'Tingkat Mudah'
                : question.difficulty === 'hard'
                ? 'Sulit (+200)'
                : question.difficulty === 'medium'
                ? 'Sedang (+150)'
                : 'Mudah (+100)'}
            </span>
          </div>

          {!blindMode && <ComboDisplay combo={combo} />}
        </div>

        {/* Delta-time timer */}
        {!isAnswered && (
          <Timer
            duration={30}
            isPaused={isPaused}
            onExpire={handleTimerExpire}
            onTick={handleTimerTick}
          />
        )}
      </div>

      {/* Main Question Box */}
      <div className="flex flex-col gap-4 my-auto py-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-slate-900/90 border border-slate-750 p-5 shadow-xl backdrop-blur-sm"
        >
          {question.arabic && (
            <div
              dir="rtl"
              className="font-arabic text-xl sm:text-2xl text-amber-300 text-center leading-loose mb-3 pb-3 border-b border-slate-800/80 tracking-wide"
            >
              {question.arabic}
            </div>
          )}

          <h2 className="text-base sm:text-lg font-bold text-slate-100 text-center leading-relaxed">
            {question.question}
          </h2>
        </motion.div>

        {/* Input area or Feedback screen */}
        <AnimatePresence mode="wait">
          {!isAnswered ? (
            <motion.div
              key="inputs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              {question.type === 'multiple-choice' && (
                <MultipleChoice
                  options={question.options || []}
                  disabled={isAnswered}
                  onSelect={handleMultipleChoiceSelect}
                />
              )}

              {question.type === 'true-false' && (
                <TrueFalse
                  disabled={isAnswered}
                  onSelect={handleTrueFalseSelect}
                />
              )}

              {question.type === 'arrange' && (
                <ArrangeQuestion
                  initialPieces={question.options || []}
                  disabled={isAnswered}
                  onSubmit={handleArrangeSubmit}
                />
              )}

              {question.type === 'fill-blank' && (
                <FillBlank
                  options={question.options || []}
                  disabled={isAnswered}
                  onSubmit={handleFillBlankSubmit}
                />
              )}
            </motion.div>
          ) : blindMode ? (
            <motion.div
              key="blind-feedback"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full rounded-2xl bg-slate-900/90 border border-slate-750 p-5 flex flex-col items-center justify-center text-center gap-3 shadow-2xl backdrop-blur-md"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xl font-bold">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-100 tracking-wide">
                  Jawaban Berhasil Disimpan
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                  Jawabanmu telah tersimpan. Skor &amp; hasil live ditampilkan di layar Host!
                </p>
              </div>
              <button
                onClick={onNext}
                className="mt-2 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <span>SOAL BERIKUTNYA</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </motion.div>
          ) : feedbackData ? (
            <motion.div
              key="feedback"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <QuestionFeedback
                question={question}
                isCorrect={feedbackData.isCorrect}
                pointsEarned={feedbackData.pointsEarned}
                baseScore={feedbackData.baseScore}
                multiplier={feedbackData.multiplier}
                onNext={onNext}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};
