import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Edit3,
  RotateCcw,
  Check,
  X,
  Plus,
  Trash2,
  HelpCircle,
  Save,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { BackButton } from './BackButton';
import { Question, CategoryId, QuestionType, Difficulty } from '../types/game';
import { CATEGORIES } from '../data/categories';
import { Storage } from '../utils/storage';
import { audioManager } from '../game/AudioManager';
import { Haptics } from '../utils/haptics';

interface QuestionManagerProps {
  questions: Question[];
  onUpdateQuestion: (updated: Question) => void;
  onDeleteQuestion: (id: number) => void;
  onResetQuestions: () => void;
  onBack: () => void;
}

export const QuestionManager: React.FC<QuestionManagerProps> = ({
  questions,
  onUpdateQuestion,
  onDeleteQuestion,
  onResetQuestions,
  onBack,
}) => {
  const [selectedCat, setSelectedCat] = useState<CategoryId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Form states for editing question
  const [formText, setFormText] = useState('');
  const [formArabic, setFormArabic] = useState('');
  const [formType, setFormType] = useState<QuestionType>('multiple-choice');
  const [formDifficulty, setFormDifficulty] = useState<Difficulty>('easy');
  const [formOptions, setFormOptions] = useState<string[]>([]);
  const [formCorrectAnswer, setFormCorrectAnswer] = useState<string | string[]>('');
  const [formExplanation, setFormExplanation] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleStartEdit = (q: Question) => {
    audioManager.playClick();
    Haptics.click();
    setEditingQuestion(q);
    setFormText(q.question);
    setFormArabic(q.arabic || '');
    setFormType(q.type);
    setFormDifficulty(q.difficulty);
    setFormOptions(q.options ? [...q.options] : []);
    // if editing a new unconfigured question with an array correctAnswer, we must clone it properly
    setFormCorrectAnswer(
      Array.isArray(q.correctAnswer) ? [...q.correctAnswer] : q.correctAnswer
    );
    setFormExplanation(q.explanation);
  };

  const handleAddNew = () => {
    const newId = questions.length > 0 ? Math.max(...questions.map((q) => q.id)) + 1 : 1;
    const newQ: Question = {
      id: newId,
      category: 'alfatihah',
      type: 'multiple-choice',
      question: '',
      options: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
      correctAnswer: 'Pilihan A',
      explanation: '',
      points: 100,
      difficulty: 'easy',
    };
    handleStartEdit(newQ);
  };

  const handleCloseEdit = () => {
    audioManager.playClick();
    Haptics.click();
    setEditingQuestion(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    if (!formText.trim()) {
      showToast('Teks pertanyaan tidak boleh kosong!');
      return;
    }

    let calculatedPoints = 100;
    if (formDifficulty === 'medium') calculatedPoints = 150;
    if (formDifficulty === 'hard') calculatedPoints = 200;

    let finalOptions = formOptions;
    let finalAnswer = formCorrectAnswer;

    if (formType === 'true-false') {
      finalOptions = ['BENAR', 'SALAH'];
      if (finalAnswer !== 'BENAR' && finalAnswer !== 'SALAH') {
        finalAnswer = 'BENAR';
      }
    } else if (formType === 'arrange') {
      // Must be an array of pieces
      if (!Array.isArray(finalAnswer) || finalAnswer.length < 2) {
        finalAnswer = formOptions.length >= 2 ? [...formOptions] : ['Bagian 1', 'Bagian 2'];
      }
    }

    const updated: Question = {
      ...editingQuestion,
      question: formText.trim(),
      arabic: formArabic.trim() || undefined,
      type: formType,
      difficulty: formDifficulty,
      points: calculatedPoints,
      options: finalOptions,
      correctAnswer: finalAnswer,
      explanation: formExplanation.trim() || 'Penjelasan untuk soal ini.',
    };

    onUpdateQuestion(updated);
    audioManager.playCorrect();
    Haptics.correct();
    showToast(`Soal #${updated.id} berhasil diperbarui!`);
    setEditingQuestion(null);
  };

  const handleAddArrangePiece = () => {
    const newPiece = `Bagian ${formOptions.length + 1}`;
    const updatedOptions = [...formOptions, newPiece];
    setFormOptions(updatedOptions);
    if (Array.isArray(formCorrectAnswer)) {
      setFormCorrectAnswer([...formCorrectAnswer, newPiece]);
    } else {
      setFormCorrectAnswer(updatedOptions);
    }
  };

  const handleRemoveArrangePiece = (index: number) => {
    if (formOptions.length <= 2) {
      showToast('Minimal 2 bagian untuk soal menyusun!');
      return;
    }
    const pieceToRemove = formOptions[index];
    const updatedOptions = formOptions.filter((_, i) => i !== index);
    setFormOptions(updatedOptions);
    if (Array.isArray(formCorrectAnswer)) {
      setFormCorrectAnswer(formCorrectAnswer.filter((item) => item !== pieceToRemove));
    }
  };

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchCat = selectedCat === 'all' || q.category === selectedCat;
      const query = searchQuery.trim().toLowerCase();
      const matchQuery =
        !query ||
        q.question.toLowerCase().includes(query) ||
        String(q.id).includes(query) ||
        (Array.isArray(q.correctAnswer)
          ? q.correctAnswer.join(' ').toLowerCase().includes(query)
          : String(q.correctAnswer).toLowerCase().includes(query)) ||
        q.explanation.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });
  }, [questions, selectedCat, searchQuery]);

  const getCategoryMeta = (catId: CategoryId) => {
    return CATEGORIES.find((c) => c.id === catId) || CATEGORIES[0];
  };

  return (
    <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-xl flex items-center gap-2 border border-amber-400"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md shrink-0">
        <BackButton onClick={onBack} label="Kembali" size="sm" />

        <div className="text-center">
          <h2 className="text-sm font-black text-slate-100 uppercase tracking-wider font-cinzel">
            Setting Pertanyaan
          </h2>
          <span className="text-[10px] text-slate-400 font-mono">
            {questions.length} Soal Tersedia
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddNew}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-bold active:scale-95 transition shadow-md shadow-emerald-500/20"
            title="Tambah Soal Baru"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tambah</span>
          </button>
          <button
            onClick={() => {
              audioManager.playClick();
              Haptics.click();
              setShowResetConfirm(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-900/50 bg-rose-950/30 text-rose-300 hover:bg-rose-950/60 text-[11px] font-bold active:scale-95 transition"
            title="Reset ke Soal Bawaan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-slate-900/60 border-b border-slate-800/80 flex flex-col gap-2 shrink-0">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => {
              audioManager.playClick();
              setSelectedCat('all');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
              selectedCat === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua (60)
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                audioManager.playClick();
                setSelectedCat(c.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition ${
                selectedCat === c.id
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{c.icon}</span>
              <span>{c.name.replace('Bedah Surat ', '')}</span>
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan kata kunci soal atau nomor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Question List */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3 pb-8">
        {filteredQuestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <HelpCircle className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-sm font-semibold">Tidak ada pertanyaan yang sesuai pencarian.</p>
            <span className="text-xs text-slate-500 mt-1">Coba gunakan kata kunci lain.</span>
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const catMeta = getCategoryMeta(q.category);
            const formattedAnswer = Array.isArray(q.correctAnswer)
              ? q.correctAnswer.join(' ➔ ')
              : String(q.correctAnswer);

            return (
              <motion.div
                key={q.id}
                layout
                className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-4 shadow-lg transition-all flex flex-col gap-2.5"
              >
                {/* Card header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-mono text-xs font-black">
                      #{String(q.id).padStart(2, '0')}
                    </span>
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <span>{catMeta.icon}</span>
                      <span>{catMeta.name}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                      {q.type === 'multiple-choice'
                        ? 'Pilihan Ganda'
                        : q.type === 'true-false'
                        ? 'Benar / Salah'
                        : q.type === 'arrange'
                        ? 'Menyusun'
                        : 'Isi Kosong'}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        q.difficulty === 'hard'
                          ? 'bg-rose-500/20 text-rose-300'
                          : q.difficulty === 'medium'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      +{q.points} pt
                    </span>
                  </div>
                </div>

                {/* Arabic text if present */}
                {q.arabic && (
                  <div
                    dir="rtl"
                    className="font-arabic text-lg text-amber-300/90 leading-relaxed text-right pt-1 pb-0.5 border-b border-slate-800/60"
                  >
                    {q.arabic}
                  </div>
                )}

                {/* Question Text */}
                <p className="text-sm font-bold text-slate-100 leading-snug">
                  {q.question}
                </p>

                {/* Options preview for multiple choice or arrange */}
                {q.options && q.options.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {q.options.map((opt, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-800 text-slate-300 font-medium"
                      >
                        {opt}
                      </span>
                    ))}
                  </div>
                )}

                {/* Answer & Explanation */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-1 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-semibold shrink-0">Kunci Jawaban:</span>
                    <span className="font-bold text-emerald-400 truncate">{formattedAnswer}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-2">
                    <span className="font-semibold text-slate-400">Penjelasan: </span>
                    {q.explanation}
                  </div>
                </div>

                {/* Edit Button */}
                <div className="pt-2 flex justify-between items-center border-t border-slate-800/80 mt-2">
                  <button
                    onClick={() => {
                      if (window.confirm('Yakin ingin menghapus soal ini?')) {
                        audioManager.playClick();
                        onDeleteQuestion(q.id);
                        showToast(`Soal #${q.id} berhasil dihapus!`);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 text-rose-400 hover:bg-rose-950 hover:text-rose-300 text-xs font-bold transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                  <button
                    onClick={() => handleStartEdit(q)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-black transition shadow-md shadow-amber-500/10"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Soal</span>
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Edit Question Modal Form */}
      <AnimatePresence>
        {editingQuestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-750 p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 font-mono text-sm font-black">
                    #{editingQuestion.id}
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                      Edit Pertanyaan
                    </h3>
                    <span className="text-[10px] text-slate-400">
                      {getCategoryMeta(editingQuestion.category).name}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCloseEdit}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                  aria-label="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Scroll Body */}
              <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto no-scrollbar py-3 space-y-3.5">
                {/* Question Text */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-300">
                    Teks Pertanyaan <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formText}
                    onChange={(e) => setFormText(e.target.value)}
                    required
                    placeholder="Masukkan pertanyaan di sini..."
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 leading-relaxed resize-none"
                  />
                </div>

                {/* Arabic Text (Optional) */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                    <span>Lafaz Bahasa Arab (Opsional)</span>
                    <span className="text-[10px] text-slate-500">Arah Kanan ke Kiri</span>
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={formArabic}
                    onChange={(e) => setFormArabic(e.target.value)}
                    placeholder="بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-amber-300 font-arabic placeholder-slate-600 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Category, Type and Difficulty Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-300">Kategori</label>
                    <select
                      value={editingQuestion.category}
                      onChange={(e) => {
                        const newCat = e.target.value as CategoryId;
                        setEditingQuestion({ ...editingQuestion, category: newCat });
                      }}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-300">Tipe Soal</label>
                    <select
                      value={formType}
                      onChange={(e) => {
                        const newType = e.target.value as QuestionType;
                        setFormType(newType);
                        if (newType === 'true-false') {
                          setFormOptions(['BENAR', 'SALAH']);
                          setFormCorrectAnswer('BENAR');
                        } else if (newType === 'multiple-choice' && formOptions.length < 4) {
                          setFormOptions(['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D']);
                          setFormCorrectAnswer('Pilihan A');
                        }
                      }}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                    >
                      <option value="multiple-choice">Pilihan Ganda (ABCD)</option>
                      <option value="true-false">Benar / Salah</option>
                      <option value="arrange">Menyusun Urutan</option>
                      <option value="fill-blank">Isi Bagian Kosong</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-300">Tingkat Kesulitan</label>
                    <select
                      value={formDifficulty}
                      onChange={(e) => setFormDifficulty(e.target.value as Difficulty)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                    >
                      <option value="easy">Mudah (+100 poin)</option>
                      <option value="medium">Sedang (+150 poin)</option>
                      <option value="hard">Sulit (+200 poin)</option>
                    </select>
                  </div>
                </div>

                {/* Dynamic Options & Answer Form */}
                {formType === 'multiple-choice' && (
                  <div className="flex flex-col gap-2 p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <label className="text-xs font-bold text-slate-300">
                      Pilihan Opsi & Kunci Jawaban
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Ketikkan 4 pilihan, dan tandai radio tombol pada jawaban yang benar:
                    </span>

                    {['A', 'B', 'C', 'D'].map((letter, idx) => {
                      const optVal = formOptions[idx] || '';
                      const isCorrect = formCorrectAnswer === optVal && optVal !== '';

                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setFormCorrectAnswer(optVal)}
                            className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold shrink-0 transition ${
                              isCorrect
                                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                            title="Tandai sebagai jawaban benar"
                          >
                            {letter}
                          </button>
                          <input
                            type="text"
                            value={optVal}
                            onChange={(e) => {
                              const newOpts = [...formOptions];
                              newOpts[idx] = e.target.value;
                              setFormOptions(newOpts);
                              if (isCorrect) {
                                setFormCorrectAnswer(e.target.value);
                              }
                            }}
                            required
                            placeholder={`Pilihan ${letter}`}
                            className="flex-1 p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {formType === 'true-false' && (
                  <div className="flex flex-col gap-2 p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <label className="text-xs font-bold text-slate-300">Kunci Jawaban</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormCorrectAnswer('BENAR')}
                        className={`py-2.5 rounded-xl text-xs font-black transition ${
                          formCorrectAnswer === 'BENAR'
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                            : 'bg-slate-900 border border-slate-800 text-slate-400'
                        }`}
                      >
                        ✓ BENAR
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormCorrectAnswer('SALAH')}
                        className={`py-2.5 rounded-xl text-xs font-black transition ${
                          formCorrectAnswer === 'SALAH'
                            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                            : 'bg-slate-900 border border-slate-800 text-slate-400'
                        }`}
                      >
                        ✕ SALAH
                      </button>
                    </div>
                  </div>
                )}

                {formType === 'arrange' && (
                  <div className="flex flex-col gap-2 p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300">
                        Urutan Potongan yang Benar
                      </label>
                      <button
                        type="button"
                        onClick={handleAddArrangePiece}
                        className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Bagian</span>
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Tuliskan potongan dari urutan pertama (atas) sampai terakhir (bawah):
                    </span>

                    {formOptions.map((piece, pIdx) => (
                      <div key={pIdx} className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 text-xs font-bold shrink-0">
                          {pIdx + 1}
                        </span>
                        <input
                          type="text"
                          value={piece}
                          onChange={(e) => {
                            const updated = [...formOptions];
                            updated[pIdx] = e.target.value;
                            setFormOptions(updated);
                            setFormCorrectAnswer(updated);
                          }}
                          required
                          className="flex-1 p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveArrangePiece(pIdx)}
                          className="p-1 text-slate-500 hover:text-rose-400"
                          title="Hapus bagian"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {formType === 'fill-blank' && (
                  <div className="flex flex-col gap-2 p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <label className="text-xs font-bold text-slate-300">
                      Kunci Kata Kosong & Pilihan Alternatif
                    </label>

                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold text-emerald-400">
                        Kata Jawaban Benar (Isian Bagian Kosong):
                      </span>
                      <input
                        type="text"
                        value={String(formCorrectAnswer)}
                        onChange={(e) => setFormCorrectAnswer(e.target.value)}
                        required
                        placeholder="Contoh: mustaqim"
                        className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-emerald-300 font-bold focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 mt-2">
                      <span className="text-[11px] font-semibold text-slate-300">
                        Opsi Pilihan yang Tampil (4 Kata):
                      </span>
                      {formOptions.map((opt, oIdx) => (
                        <input
                          key={oIdx}
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const updated = [...formOptions];
                            updated[oIdx] = e.target.value;
                            setFormOptions(updated);
                          }}
                          required
                          placeholder={`Pilihan kata #${oIdx + 1}`}
                          className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Explanation */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>Penjelasan Edukasi Jawaban</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formExplanation}
                    onChange={(e) => setFormExplanation(e.target.value)}
                    required
                    placeholder="Tuliskan penjelasan agar pemain memahami ilmu dari soal ini..."
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 leading-relaxed resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseEdit}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold active:scale-95 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 active:scale-95 transition"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Dialog */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-750 p-6 shadow-2xl flex flex-col items-center text-center gap-4"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-100 uppercase tracking-wide">
                  Kembalikan ke Soal Bawaan?
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Seluruh perubahan teks soal yang telah kamu edit akan dikembalikan ke 60 soal asli bawaan game.
                </p>
              </div>

              <div className="flex items-center gap-2.5 w-full mt-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 text-xs font-bold active:scale-95"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    onResetQuestions();
                    setShowResetConfirm(false);
                    audioManager.playCorrect();
                    Haptics.correct();
                    showToast('Semua soal telah dikembalikan ke bawaan!');
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black active:scale-95"
                >
                  Kembalikan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
