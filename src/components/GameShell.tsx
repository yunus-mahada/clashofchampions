import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameState } from '../hooks/useGameState';
import { CATEGORIES } from '../data/categories';
import { BackgroundCanvas } from './BackgroundCanvas';
import { ScoreHUD } from './ScoreHUD';
import { MainMenu } from './MainMenu';
import { CategoryGrid } from './CategoryGrid';
import { QuestionGrid } from './QuestionGrid';
import { QuestionScreen } from './QuestionScreen';
import { QuestionManager } from './QuestionManager';
import { MultiplayerMenu } from './MultiplayerMenu';
import { HostLobby } from './HostLobby';
import { HostScoreboard } from './HostScoreboard';
import { PlayerJoin } from './PlayerJoin';
import { PlayerLobby } from './PlayerLobby';
import { PlayerLiveGame } from './PlayerLiveGame';
import { PlayerLiveFinish } from './PlayerLiveFinish';
import { PauseOverlay } from './PauseOverlay';
import { CategoryComplete } from './CategoryComplete';
import { GameComplete } from './GameComplete';
import { SettingsModal } from './SettingsModal';
import { HowToPlayModal } from './HowToPlayModal';
import { ResetConfirmModal } from './ResetConfirmModal';

export const GameShell: React.FC = () => {
  const {
    screen,
    selectedCategory,
    currentQuestionId,
    data,
    questions,
    lastResult,
    showSettings,
    showHowToPlay,
    showResetConfirm,
    setShowSettings,
    setShowHowToPlay,
    setShowResetConfirm,
    openQuestionManager,
    updateQuestion,
    deleteQuestion,
    resetQuestionsToDefault,
    multiplayerRoom,
    multiplayerPlayer,
    multiplayerFinalResult,
    openMultiplayerMenu,
    startHostLobby,
    startHostScoreboard,
    openPlayerJoin,
    handlePlayerJoined,
    handlePlayerStartGame,
    handlePlayerFinishGame,
    leaveMultiplayer,
    startNewGame,
    continueGame,
    selectCategory,
    selectQuestion,
    handleAnswer,
    nextQuestion,
    pauseGame,
    resumeGame,
    restartCategory,
    resetAll,
    toggleSound,
    toggleMusic,
    setSoundVolume,
    setMusicVolume,
    navigateTo,
    goBack,
    exitToast,
  } = useGameState();

  const answeredCount = Object.keys(data.completedQuestions).length;

  const activeCategory = selectedCategory
    ? CATEGORIES.find((c) => c.id === selectedCategory)
    : null;

  const activeQuestion = currentQuestionId
    ? questions.find((q) => q.id === currentQuestionId)
    : null;

  const activeCategoryQuestions = selectedCategory
    ? questions.filter((q) => q.category === selectedCategory)
    : [];

  const currentQIndex = activeQuestion && selectedCategory
    ? activeCategoryQuestions.findIndex((q) => q.id === activeQuestion.id) + 1
    : undefined;

  const isSoloQuizScreen =
    screen === 'category' ||
    screen === 'question-list' ||
    screen === 'playing' ||
    screen === 'result';

  return (
    <div className="relative w-screen h-[100dvh] overflow-hidden bg-slate-950 flex flex-col justify-between bg-islamic-pattern select-none">
      {/* 2D Particle Background Canvas */}
      <BackgroundCanvas />

      {/* Top HUD (visible on solo category, question-list, playing, result) */}
      {isSoloQuizScreen && (
        <ScoreHUD
          score={data.currentScore}
          combo={data.combo}
          questionIndex={currentQIndex}
          totalQuestions={activeCategoryQuestions.length || 15}
          title={
            screen === 'playing' || screen === 'result'
              ? activeCategory?.name
              : screen === 'question-list'
              ? activeCategory?.name
              : 'PILIH KATEGORI'
          }
          onBack={goBack}
          onPause={screen === 'playing' ? pauseGame : undefined}
          soundEnabled={data.soundEnabled}
          onToggleSound={toggleSound}
        />
      )}

      {/* Screen Router */}
      <main className="flex-1 w-full flex flex-col min-h-0 relative z-20">
        {screen === 'menu' && (
          <MainMenu
            highScore={data.highScore}
            currentScore={data.currentScore}
            answeredCount={answeredCount}
            soundEnabled={data.soundEnabled}
            onStartNew={() => {
              if (answeredCount > 0) {
                setShowResetConfirm(true);
              } else {
                startNewGame();
              }
            }}
            onContinue={continueGame}
            onOpenMultiplayer={openMultiplayerMenu}
            onOpenHowToPlay={() => setShowHowToPlay(true)}
            onOpenSettings={() => setShowSettings(true)}
            onToggleSound={toggleSound}
          />
        )}

        {/* Solo Mode Screens */}
        {screen === 'category' && (
          <CategoryGrid
            completedMap={data.completedQuestions}
            onSelectCategory={selectCategory}
          />
        )}

        {screen === 'question-list' && selectedCategory && (
          <QuestionGrid
            categoryId={selectedCategory}
            completedMap={data.completedQuestions}
            activeQuestionId={currentQuestionId}
            questions={questions}
            onSelectQuestion={selectQuestion}
            onRestartCategory={restartCategory}
          />
        )}

        {(screen === 'playing' || screen === 'result') && activeQuestion && (
          <QuestionScreen
            question={activeQuestion}
            combo={data.combo}
            isPaused={screen === 'result'}
            isAnswered={screen === 'result'}
            feedbackData={lastResult}
            onAnswer={handleAnswer}
            onNext={nextQuestion}
          />
        )}

        {screen === 'category-complete' && selectedCategory && (
          <CategoryComplete
            categoryId={selectedCategory}
            completedMap={data.completedQuestions}
            currentScore={data.currentScore}
            bestCombo={data.bestCombo}
            onContinue={() => navigateTo('category')}
          />
        )}

        {screen === 'game-complete' && (
          <GameComplete
            score={data.currentScore}
            bestCombo={data.bestCombo}
            totalCorrect={data.totalCorrect}
            totalWrong={data.totalWrong}
            completedMap={data.completedQuestions}
            onPlayAgain={startNewGame}
            onGoHome={() => navigateTo('menu')}
          />
        )}

        {screen === 'question-manager' && (
          <QuestionManager
            questions={questions}
            onUpdateQuestion={updateQuestion}
            onDeleteQuestion={deleteQuestion}
            onResetQuestions={resetQuestionsToDefault}
            onBack={() => navigateTo('menu')}
          />
        )}

        {/* Multiplayer Live Room Screens */}
        {screen === 'multiplayer-menu' && (
          <MultiplayerMenu
            onHostRoom={startHostLobby}
            onJoinRoom={openPlayerJoin}
            onBack={leaveMultiplayer}
          />
        )}

        {screen === 'host-lobby' && (
          <HostLobby
            allQuestions={questions}
            onStartScoreboard={startHostScoreboard}
            onBack={leaveMultiplayer}
          />
        )}

        {screen === 'host-scoreboard' && multiplayerRoom && (
          <HostScoreboard
            room={multiplayerRoom}
            allQuestions={questions}
            onExit={leaveMultiplayer}
          />
        )}

        {screen === 'player-join' && (
          <PlayerJoin
            onJoinSuccess={handlePlayerJoined}
            onBack={leaveMultiplayer}
          />
        )}

        {screen === 'player-lobby' && multiplayerRoom && multiplayerPlayer && (
          <PlayerLobby
            room={multiplayerRoom}
            player={multiplayerPlayer}
            onGameStart={handlePlayerStartGame}
            onLeave={leaveMultiplayer}
          />
        )}

        {screen === 'player-live-game' && multiplayerRoom && multiplayerPlayer && (
          <PlayerLiveGame
            room={multiplayerRoom}
            player={multiplayerPlayer}
            allQuestions={questions}
            onFinish={handlePlayerFinishGame}
            onLeave={leaveMultiplayer}
          />
        )}

        {screen === 'player-live-finish' && multiplayerRoom && multiplayerPlayer && multiplayerFinalResult && (
          <PlayerLiveFinish
            room={multiplayerRoom}
            player={multiplayerPlayer}
            finalScore={multiplayerFinalResult.finalScore}
            correctCount={multiplayerFinalResult.correctCount}
            wrongCount={multiplayerFinalResult.wrongCount}
            onGoHome={leaveMultiplayer}
          />
        )}
      </main>

      {/* Pause Overlay */}
      {screen === 'pause' && (
        <PauseOverlay
          score={data.currentScore}
          soundEnabled={data.soundEnabled}
          musicEnabled={data.musicEnabled}
          soundVolume={data.soundVolume}
          musicVolume={data.musicVolume}
          onResume={resumeGame}
          onRestartCategory={restartCategory}
          onGoToCategory={() => navigateTo('category')}
          onToggleSound={toggleSound}
          onToggleMusic={toggleMusic}
          onChangeSoundVolume={setSoundVolume}
          onChangeMusicVolume={setMusicVolume}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        soundEnabled={data.soundEnabled}
        musicEnabled={data.musicEnabled}
        soundVolume={data.soundVolume}
        musicVolume={data.musicVolume}
        onClose={() => setShowSettings(false)}
        onToggleSound={toggleSound}
        onToggleMusic={toggleMusic}
        onChangeSoundVolume={setSoundVolume}
        onChangeMusicVolume={setMusicVolume}
        onOpenQuestionManager={openQuestionManager}
        onOpenResetConfirm={() => {
          setShowSettings(false);
          setShowResetConfirm(true);
        }}
      />

      {/* How to Play Modal */}
      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      />

      {/* Reset Confirmation Dialog */}
      <ResetConfirmModal
        isOpen={showResetConfirm}
        answeredCount={answeredCount}
        currentScore={data.currentScore}
        onConfirm={resetAll}
        onCancel={() => setShowResetConfirm(false)}
      />

      {/* Native Phone Exit Toast (Android & iPhone Gesture Back Indicator) */}
      <AnimatePresence>
        {exitToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-slate-900/95 border border-amber-500/50 text-amber-300 text-xs font-bold shadow-2xl backdrop-blur-md flex items-center gap-2 pointer-events-none select-none"
          >
            <span>📱</span>
            <span>Tekan tombol kembali sekali lagi untuk keluar</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
