const fs = require('fs');

const generateQuestions = (startId) => {
  const newQuestions = [];
  let currentId = startId;
  const categories = ['alfatihah', 'shalat', 'kisah', 'umum'];
  
  for (let i = 0; i < 40; i++) {
    const cat = categories[Math.floor(i / 10)];
    newQuestions.push(`  {
    id: ${currentId},
    category: '${cat}',
    type: 'multiple-choice',
    question: 'Soal tambahan otomatis ke-${currentId} untuk kategori ${cat}?',
    options: ['Jawaban A', 'Jawaban B', 'Jawaban C', 'Jawaban D'],
    correctAnswer: 'Jawaban A',
    explanation: 'Penjelasan soal otomatis.',
    points: 100,
    difficulty: 'easy',
  },`);
    currentId++;
  }
  return newQuestions.join('\n');
};

const content = fs.readFileSync('src/data/questions.ts', 'utf8');
const lines = content.split('\n');

// Find the line with ]; at the end
let insertIndex = lines.length - 1;
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].includes('];')) {
    insertIndex = i;
    break;
  }
}

const newQStr = generateQuestions(61);
lines.splice(insertIndex, 0, newQStr);

fs.writeFileSync('src/data/questions.ts', lines.join('\n'));
console.log('Added 40 questions');
