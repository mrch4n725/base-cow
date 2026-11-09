import { tierCatalog, generateQuestionSet, markAnswers } from './logic.js';

const tierSelect = document.querySelector('#tierSelect');
const quantityInput = document.querySelector('#questionCount');
const refreshButton = document.querySelector('#refreshQuestions');
const questionList = document.querySelector('#questionList');
const scorePanel = document.querySelector('#scorePanel');
let currentQuestions = [];

function populateTierOptions() {
  Object.entries(tierCatalog).forEach(([key, tier]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = tier.label;
    tierSelect.appendChild(option);
  });
}

function renderSet(questions) {
  questionList.replaceChildren();
  currentQuestions = questions;

  questions.forEach((question, index) => {
    const card = document.createElement('article');
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
    input.placeholder = 'Your answer';
    input.setAttribute('aria-label', `Answer to question ${index + 1}`);
    input.dataset.index = String(index);
    input.className = 'answer-input';

    const feedback = document.createElement('p');
    feedback.className = 'answer-feedback hidden';
    feedback.setAttribute('aria-live', 'polite');

    card.append(label, prompt, input, feedback);
    questionList.appendChild(card);
  });

  scorePanel.classList.add('hidden');
}

function checkAnswers() {
  const inputs = [...questionList.querySelectorAll('.answer-input')];
  const { results, score } = markAnswers(
    currentQuestions,
    inputs.map((input) => input.value),
  );

  inputs.forEach((input, index) => {
    const result = results[index];
    const feedback = input.nextElementSibling;
    input.classList.toggle('correct', result.correct);
    input.classList.toggle('incorrect', !result.correct);
    feedback.textContent = `${result.correct ? 'Correct' : 'Not quite'} — answer: ${result.answer}`;
    feedback.classList.remove('hidden');
    feedback.classList.toggle('correct-text', result.correct);
    feedback.classList.toggle('incorrect-text', !result.correct);
  });

  scorePanel.textContent = `Score: ${score} / ${currentQuestions.length}`;
  scorePanel.classList.remove('hidden');
}

function clearFeedback(event) {
  const input = event.target.closest('.answer-input');
  if (!input) return;
  input.classList.remove('correct', 'incorrect');
  const feedback = input.nextElementSibling;
  feedback.classList.add('hidden');
  scorePanel.classList.add('hidden');
}

function refreshQuestions() {
  const count = Math.min(30, Math.max(1, Number(quantityInput.value) || 10));
  quantityInput.value = String(count);
  renderSet(generateQuestionSet(tierSelect.value, count));
}

refreshButton.addEventListener('click', refreshQuestions);
document.querySelector('#checkAnswers').addEventListener('click', checkAnswers);
questionList.addEventListener('input', clearFeedback);

populateTierOptions();
tierSelect.value = 'A-Level AS';
refreshQuestions();
