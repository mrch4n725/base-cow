import { tierCatalog, topicCatalog, generateQuestionSet, markAnswers } from './logic.js';

const tierOptions = document.querySelector('#tierOptions');
const tierDescription = document.querySelector('#tierDescription');
const topicOptions = document.querySelector('#topicOptions');
const topicValidation = document.querySelector('#topicValidation');
const quantityInput = document.querySelector('#questionCount');
const refreshButton = document.querySelector('#refreshQuestions');
const themeToggle = document.querySelector('#themeToggle');
const questionList = document.querySelector('#questionList');
const scorePanel = document.querySelector('#scorePanel');
const tierTagline = document.querySelector('#tierTagline');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
let currentQuestions = [];
let userChoseTheme = false;

function setTheme(isDark) {
  document.body.dataset.theme = isDark ? 'dark' : 'light';
  themeToggle.setAttribute('aria-pressed', String(isDark));
  themeToggle.textContent = isDark ? 'Light mode' : 'Dark mode';
}

function populateTierOptions() {
  Object.entries(tierCatalog).forEach(([key, tier]) => {
    const label = document.createElement('label');
    label.className = 'tier-option';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'tier';
    input.value = key;
    input.checked = key === 'A-Level AS';
    const text = document.createElement('span');
    text.textContent = tier.label;
    label.append(input, text);
    tierOptions.appendChild(label);
  });
}

function renderTierTagline() {
  Object.values(tierCatalog).forEach((tier, index) => {
    if (index > 0) {
      const separator = document.createElement('span');
      separator.className = 'tagline-separator';
      separator.textContent = ' // ';
      tierTagline.appendChild(separator);
    }
    const label = document.createElement('span');
    label.textContent = tier.label;
    tierTagline.appendChild(label);
  });
}

function populateTopicOptions() {
  Object.entries(topicCatalog).forEach(([topicId, topic]) => {
    const label = document.createElement('label');
    label.className = 'topic-option';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = 'topic';
    input.value = topicId;
    input.dataset.topicId = topicId;
    const text = document.createElement('span');
    text.textContent = topic.label;
    const availability = document.createElement('span');
    availability.className = 'visually-hidden';
    availability.id = `topic-availability-${topicId}`;
    label.append(input, text, availability);
    topicOptions.appendChild(label);
  });
}

function selectedTier() {
  return document.querySelector('input[name="tier"]:checked')?.value || 'A-Level AS';
}

function updateTierSelection() {
  const tier = tierCatalog[selectedTier()];
  tierDescription.textContent = tier.description;

  topicOptions.querySelectorAll('input[name="topic"]').forEach((input) => {
    const enabled = tier.topics.includes(input.value);
    const label = input.closest('.topic-option');
    const availability = label.querySelector('.visually-hidden');
    input.disabled = !enabled;
    input.checked = enabled;
    label.classList.toggle('is-disabled', !enabled);
    if (enabled) {
      input.removeAttribute('title');
      input.removeAttribute('aria-describedby');
      availability.textContent = '';
    } else {
      const notice = `Not in the ${tier.label} specification`;
      input.title = notice;
      input.setAttribute('aria-describedby', availability.id);
      availability.textContent = notice;
    }
  });
  topicValidation.classList.add('hidden');
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

    const feedback = document.createElement('div');
    feedback.className = 'answer-feedback hidden';
    const resultText = document.createElement('p');
    resultText.className = 'answer-result';
    resultText.setAttribute('aria-live', 'polite');
    feedback.appendChild(resultText);

    card.append(label, prompt, input, feedback);
    questionList.appendChild(card);
  });

  scorePanel.classList.add('hidden');
}

function renderFeedback(input, result) {
  const feedback = input.nextElementSibling;
  const resultText = feedback.querySelector('.answer-result');
  resultText.textContent = `${result.correct ? 'Correct' : 'Not quite'} — answer: ${result.answer}`;
  feedback.querySelector('.answer-reason')?.remove();
  feedback.querySelector('details')?.remove();

  if (!result.correct && result.reason) {
    const reason = document.createElement('p');
    reason.className = 'answer-reason';
    reason.textContent = result.reason;
    feedback.appendChild(reason);
  }

  if (result.working.length > 0) {
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = 'Show working';
    const list = document.createElement('ol');
    result.working.forEach((step) => {
      const item = document.createElement('li');
      item.textContent = step;
      list.appendChild(item);
    });
    details.append(summary, list);
    feedback.appendChild(details);
  }

  input.classList.toggle('correct', result.correct);
  input.classList.toggle('incorrect', !result.correct);
  feedback.classList.remove('hidden');
}

function checkAnswers() {
  const inputs = [...questionList.querySelectorAll('.answer-input')];
  const { results, score } = markAnswers(
    currentQuestions,
    inputs.map((input) => input.value),
  );

  inputs.forEach((input, index) => {
    renderFeedback(input, results[index]);
  });

  scorePanel.textContent = `Score: ${score} / ${currentQuestions.length}`;
  scorePanel.classList.remove('hidden');
}

function checkSingleAnswer(input) {
  const index = Number(input.dataset.index);
  const result = markAnswers([currentQuestions[index]], [input.value]).results[0];
  renderFeedback(input, result);
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
  const enabledTopics = [...topicOptions.querySelectorAll('input[name="topic"]:checked:not(:disabled)')]
    .map((input) => input.value);
  if (enabledTopics.length === 0) {
    topicValidation.textContent = 'Select at least one topic before refreshing questions.';
    topicValidation.classList.remove('hidden');
    return;
  }
  topicValidation.classList.add('hidden');
  const count = Math.min(30, Math.max(1, Number(quantityInput.value) || 10));
  quantityInput.value = String(count);
  renderSet(generateQuestionSet(selectedTier(), count, enabledTopics));
}

function updateSystemTheme(event) {
  if (!userChoseTheme) setTheme(event.matches);
}

refreshButton.addEventListener('click', refreshQuestions);
tierOptions.addEventListener('change', updateTierSelection);
themeToggle.addEventListener('click', () => {
  userChoseTheme = true;
  setTheme(document.body.dataset.theme !== 'dark');
});
systemTheme.addEventListener('change', updateSystemTheme);
document.querySelector('#checkAnswers').addEventListener('click', checkAnswers);
questionList.addEventListener('input', clearFeedback);
questionList.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' || !event.target.matches('.answer-input')) return;
  event.preventDefault();
  checkSingleAnswer(event.target);
});
topicOptions.addEventListener('change', () => {
  if (topicOptions.querySelector('input[name="topic"]:checked:not(:disabled)')) {
    topicValidation.classList.add('hidden');
  }
});

populateTierOptions();
renderTierTagline();
populateTopicOptions();
updateTierSelection();
setTheme(systemTheme.matches);
refreshQuestions();
