import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Flame, Clock, Award, HelpCircle } from 'lucide-react';
import { audioManager } from '../game/AudioManager';
import { Haptics } from '../utils/haptics';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-750 p-6 shadow-2xl flex flex-col gap-4 text-left max-h-[85vh] overflow-y-auto no-scrollbar"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">📖</span>
              <h3 className="text-base font-black text-slate-100 uppercase tracking-wider font-cinzel">
                CARA BERMAIN
              </h3>
            </div>
            <button
              onClick={() => {
                audioManager.playClick();
                Haptics.click();
                onClose();
              }}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            {/* Mission */}
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="font-bold text-amber-300 text-sm mb-1">
                🎯 Misi Permainan
              </div>
              <p>
                Selesaikan <strong>60 soal</strong> yang terbagi ke dalam <strong>4 pilar kategori</strong> (masing-masing 15 soal) dengan perolehan skor tertinggi untuk meraih gelar <strong>Clash Master</strong>!
              </p>
            </div>

            {/* 4 Pillars */}
            <div className="space-y-2">
              <span className="font-bold text-slate-200 block">4 Kategori Utama:</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-amber-400 font-bold block mb-0.5">🕌 Al-Fatihah</span>
                  <span className="text-[11px] text-slate-400">Ayat, arti, dan rahasia surat pembuka.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-emerald-400 font-bold block mb-0.5">🧎 Bacaan Shalat</span>
                  <span className="text-[11px] text-slate-400">Doa ruku, sujud, dan tasyahud.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-sky-400 font-bold block mb-0.5">📖 Kisah</span>
                  <span className="text-[11px] text-slate-400">Kisah Nabi, Rasul, dan Sahabat mulia.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-violet-400 font-bold block mb-0.5">🧠 Wawasan Umum</span>
                  <span className="text-[11px] text-slate-400">Pengetahuan Islam seru dan edukatif.</span>
                </div>
              </div>
            </div>

            {/* 4 Question types */}
            <div className="space-y-2">
              <span className="font-bold text-slate-200 block">4 Ragam Tantangan:</span>
              <ul className="space-y-1.5 text-[11px] text-slate-300">
                <li className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center">1</span>
                  <strong>Pilihan Ganda (ABCD)</strong>: Pilih 1 jawaban yang paling tepat.
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center">2</span>
                  <strong>Benar / Salah</strong>: Tentukan kebenaran sebuah pernyataan.
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center">3</span>
                  <strong>Menyusun Kalimat</strong>: Geser urutan potongan lafaz atau peristiwa.
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center">4</span>
                  <strong>Mengisi Bagian Kosong</strong>: Lengkapi kata yang hilang.
                </li>
              </ul>
            </div>

            {/* Combo & Timer */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center gap-1 font-bold text-orange-400 text-xs mb-1">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Sistem Combo (Solo)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Benar berturut-turut melipatgandakan skor hingga <strong>2.0x</strong>. Jika salah, combo kembali ke x1.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center gap-1 font-bold text-sky-400 text-xs mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Timer 30 Detik</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Jawab sebelum waktu habis. Waktu dihitung presisi menggunakan delta-time.
                </p>
              </div>
            </div>

            {/* Live Multiplayer Arena Speed Scoring Rule */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border-2 border-amber-500/40 shadow-lg">
              <div className="flex items-center gap-1.5 font-black text-amber-300 text-xs mb-1.5 uppercase tracking-wide">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Aturan Skor Live Multiplayer Arena:</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-300 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold shrink-0">1.</span>
                  <span><strong>Skor Adu Cepat & Benar</strong>: Poin dihitung untuk setiap peserta yang menjawab <strong>BENAR</strong> dan <strong>PALING CEPAT</strong>.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold shrink-0">2.</span>
                  <span><strong>Poin Tergantung Jumlah Peserta (N)</strong>: Nilai maksimal per soal sama dengan total peserta yang ada di room.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold shrink-0">3.</span>
                  <span><strong>Contoh (21 Peserta)</strong>:
                    <br />• Benar & Tercepat ke-1 = <strong>21 Poin</strong>
                    <br />• Benar & Tercepat ke-2 = <strong>20 Poin</strong>
                    <br />• Benar & Tercepat ke-3 = <strong>19 Poin</strong>, dan seterusnya.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-rose-400 font-bold shrink-0">4.</span>
                  <span><strong>Jawaban Salah = 0 (NOL) Poin</strong>: Meskipun menjawab paling cepat, jika jawabannya salah maka mendapatkan <strong>0 poin</strong>.</span>
                </li>
              </ul>
            </div>

            {/* Champion Ranks */}
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center gap-1 font-bold text-amber-300 text-xs mb-1">
                <Award className="w-3.5 h-3.5" />
                <span>Peringkat Juara:</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300 font-mono">
                <span>👑 8.001+ : CLASH MASTER</span>
                <span>🏆 6.001–8.000 : QUIZ CHAMPION</span>
                <span>🌟 4.001–6.000 : ISLAMIC SCHOLAR</span>
                <span>🧭 2.001–4.000 : EXPLORER</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              audioManager.playClick();
              Haptics.click();
              onClose();
            }}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider transition"
          >
            Mengerti & Siap Bertanding
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
