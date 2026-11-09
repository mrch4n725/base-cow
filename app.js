import { tierCatalog, generateQuestionSet, evaluateAnswer } from './logic.js';

const tierSelect = document.querySelector('#tierSelect');
const quantityInput = document.querySelector('#questionCount');
const generateButton = document.querySelector('#generateQuestions');
const questionList = document.querySelector('#questionList');
const scorePanel = document.querySelector('#scorePanel');
const answersToggle = document.querySelector('#toggleAnswers');
const seedCode = document.querySelector('#seedCode');
let currentQuestions = [];

function populateTierOptions() {
  Object.entries(tierCatalog).forEach(([key, tier]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = `${tier.label} — ${tier.description}`;
    tierSelect.appendChild(option);
  });
}

function renderSet(questions) {
  questionList.innerHTML = '';
  currentQuestions = questions;

  questions.forEach((question, index) => {
    const card = document.createElement('div');
    card.className = 'question-card';

    const label = document.createElement('p');
    label.className = 'question-label';
    label.textContent = `Question ${index + 1}`;

    const prompt = document.createElement('p');
    prompt.className = 'question-prompt';
    prompt.textContent = question.prompt;

    const input = document.createElement('input');
    input.type = 'text';
    input.name = `q-${index}`;
    input.placeholder = 'Type your answer';
    input.dataset.index = String(index);
    input.className = 'answer-input';

    const reveal = document.createElement('div');
    reveal.className = 'answer-reveal hidden';
    reveal.textContent = `Answer: ${question.answer}`;

    card.append(label, prompt, input, reveal);
    questionList.appendChild(card);
  });

  scorePanel.classList.add('hidden');
  answersToggle.checked = false;
}

function updateAnswerVisibility(isVisible) {
  const reveals = document.querySelectorAll('.answer-reveal');
  reveals.forEach((node) => {
    node.classList.toggle('hidden', !isVisible);
  });
}

function checkAnswers() {
  let score = 0;
  const inputs = [...document.querySelectorAll('.answer-input')];
  inputs.forEach((input) => {
    const index = Number(input.dataset.index);
    const question = currentQuestions[index];
    const isCorrect = evaluateAnswer(question, input.value);
    if (isCorrect) score += 1;
    input.classList.toggle('correct', isCorrect);
    input.classList.toggle('incorrect', !isCorrect && input.value.trim() !== '');
  });

  scorePanel.textContent = `Score: ${score} / ${currentQuestions.length}`;
  scorePanel.classList.remove('hidden');
}

function generateSet() {
  const tier = tierSelect.value;
  const count = Number(quantityInput.value) || 10;
  const qSet = generateQuestionSet(tier, count);
  seedCode.value = `${tier.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString().slice(-6)}`;
  renderSet(qSet);
}

generateButton.addEventListener('click', generateSet);
answersToggle.addEventListener('change', () => updateAnswerVisibility(answersToggle.checked));
document.querySelector('#checkAnswers').addEventListener('click', checkAnswers);

document.addEventListener('DOMContentLoaded', () => {
  populateTierOptions();
  tierSelect.value = 'GCSE Higher';
  generateSet();
});
