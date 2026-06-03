'use strict';

// ─── State ────────────────────────────────────────────────────────────────────
const state = {
  selectedVerbs:  new Set(),
  selectedTenses: new Set(),
  questions:      [],
  current:        0,
  correct:        0,
  answered:       false,
  results:        [],
};

// ─── Accent characters ────────────────────────────────────────────────────────
const ACCENTS = ['à','â','ä','é','è','ê','ë','î','ï','ô','ù','û','ü','ç','œ','æ',
                 'À','Â','É','È','Ê','Î','Ô','Ù','Û','Ç'];

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const screens = {
  setup:   $('screen-setup'),
  quiz:    $('screen-quiz'),
  results: $('screen-results'),
};

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

// ─── Setup screen ─────────────────────────────────────────────────────────────

function buildTenseList() {
  const list = $('tense-list');
  for (const [key, meta] of Object.entries(TENSES)) {
    const item = document.createElement('div');
    item.className = 'check-item' + (meta.compound ? ' compound' : '');
    item.innerHTML = `
      <input type="checkbox" id="t-${key}" value="${key}">
      <label for="t-${key}">${meta.label}${meta.compound ? ' <small>(compound)</small>' : ''}</label>
    `;
    const cb = item.querySelector('input');
    cb.addEventListener('change', () => {
      if (cb.checked) state.selectedTenses.add(key);
      else            state.selectedTenses.delete(key);
      updateStartBtn();
    });
    list.appendChild(item);
  }
}

let activeGroup = 'all';
let verbSearchQ  = '';

function buildGroupFilter() {
  const row = $('group-filter-row');
  const groups = [['all','Tous'], ...Object.entries(VERB_GROUPS)];
  for (const [key, label] of groups) {
    const chip = document.createElement('button');
    chip.className = 'group-chip' + (key === 'all' ? ' active' : '');
    chip.textContent = label;
    chip.dataset.group = key;
    chip.addEventListener('click', () => {
      activeGroup = key;
      row.querySelectorAll('.group-chip').forEach(c => c.classList.toggle('active', c.dataset.group === key));
      renderVerbList();
    });
    row.appendChild(chip);
  }
}

function renderVerbList() {
  const list = $('verb-list');
  list.innerHTML = '';
  const q = verbSearchQ.toLowerCase();
  for (const verb of VERBS) {
    if (activeGroup !== 'all' && verb.group !== activeGroup) continue;
    if (q && !verb.infinitive.includes(q) && !verb.english.toLowerCase().includes(q)) continue;

    const item = document.createElement('div');
    item.className = 'verb-item';
    const checked = state.selectedVerbs.has(verb.infinitive) ? 'checked' : '';
    item.innerHTML = `
      <input type="checkbox" id="v-${verb.infinitive}" ${checked}>
      <label for="v-${verb.infinitive}">
        <span class="v-inf">${verb.infinitive}</span>
        <span class="v-en"> — ${verb.english}</span>
      </label>
      <span class="v-tag">${VERB_GROUPS[verb.group]}</span>
    `;
    const cb = item.querySelector('input');
    cb.addEventListener('change', () => {
      if (cb.checked) state.selectedVerbs.add(verb.infinitive);
      else            state.selectedVerbs.delete(verb.infinitive);
      updateBadge();
      updateStartBtn();
    });
    list.appendChild(item);
  }
}

function updateBadge() {
  $('verb-count-badge').textContent = state.selectedVerbs.size;
}

function updateStartBtn() {
  const ok = state.selectedVerbs.size > 0 && state.selectedTenses.size > 0;
  $('start-btn').disabled = !ok;
}

function setAllTenses(on) {
  document.querySelectorAll('#tense-list input[type=checkbox]').forEach(cb => {
    cb.checked = on;
    if (on) state.selectedTenses.add(cb.value);
    else    state.selectedTenses.delete(cb.value);
  });
  updateStartBtn();
}

function setAllVerbs(on) {
  state.selectedVerbs.clear();
  document.querySelectorAll('#verb-list input[type=checkbox]').forEach(cb => {
    cb.checked = on;
    if (on) state.selectedVerbs.add(cb.value);
  });
  // If "all on", add all visible verbs (respecting filter)
  if (on) {
    const q = verbSearchQ.toLowerCase();
    for (const verb of VERBS) {
      if (activeGroup !== 'all' && verb.group !== activeGroup) continue;
      if (q && !verb.infinitive.includes(q) && !verb.english.toLowerCase().includes(q)) continue;
      state.selectedVerbs.add(verb.infinitive);
    }
  }
  updateBadge();
  updateStartBtn();
}

// ─── Question generation ──────────────────────────────────────────────────────

function generateQuestions() {
  const count   = Math.min(parseInt($('q-count').value) || 20, 200);
  const tenses  = [...state.selectedTenses];
  const verbs   = VERBS.filter(v => state.selectedVerbs.has(v.infinitive));
  const pool    = [];

  for (const verb of verbs) {
    for (const tense of tenses) {
      const forms = verb.forms[tense];
      if (forms == null) continue;

      // Single-form tenses (participe présent / passé): one question, no pronoun
      if (TENSES[tense].single) {
        pool.push({ verb, tense, personIdx: null });
        continue;
      }

      for (let i = 0; i < 6; i++) {
        if (forms[i] == null) continue; // null = doesn't exist (impersonal / no imperative)
        // Skip imperatif for je (0) and il (2) and ils (5)
        if (tense === 'imperatif' && (i === 0 || i === 2 || i === 5)) continue;
        pool.push({ verb, tense, personIdx: i });
      }
    }
  }

  // Shuffle and pick
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

// ─── Quiz screen ──────────────────────────────────────────────────────────────

const IMPERATIF_SUBJECTS = [null, 'tu', null, 'nous', 'vous', null];

// Correct answer + subject pronoun for a given question.
function getAnswer(q) {
  const f = q.verb.forms[q.tense];
  return TENSES[q.tense].single ? f : f[q.personIdx];
}
function getSubject(q) {
  if (TENSES[q.tense].single) return null;
  if (q.tense === 'imperatif') return IMPERATIF_SUBJECTS[q.personIdx];
  return SUBJECTS[q.personIdx];
}

// All answers we accept as correct: the stored form plus any valid alternate —
// spelling variants ("paye"/"paie", "puis"/"peux") and, for être verbs, every
// valid gender/number agreement ("suis allé"/"suis allée", "sommes allés"/"…allées").
function acceptedAnswers(q) {
  const list = [getAnswer(q)];
  const altT = q.verb.alt && q.verb.alt[q.tense];
  if (altT && !TENSES[q.tense].single) {
    const entry = altT[q.personIdx];
    if (entry != null) (Array.isArray(entry) ? entry : [entry]).forEach(x => list.push(x));
  }
  return list.map(normalise).filter(Boolean);
}

// Full, naturally-elided answer for display: "j'ai fait", "qu'il/elle aille".
const VOWEL_START = /^[aàâäeéèêëiîïoôöuùûüh]/i;
function fullAnswer(q, form) {
  const tmeta = TENSES[q.tense];
  if (tmeta.single || q.tense === 'imperatif') return form; // participles / imperative: no subject
  let subj = getSubject(q);
  if (q.tense === 'subjonctifPresent') {
    if (/^(il|elle|on|ils|elles)/.test(subj)) subj = "qu'" + subj;       // qu'il/elle
    else subj = 'que ' + subj;                                          // que je / que tu …
  }
  if (/je$/.test(subj) && VOWEL_START.test(form)) {                     // je → j'
    return subj.replace(/je$/, "j'") + form;
  }
  return subj + ' ' + form;
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Renders the natural answer with the pronoun/elision DIMMED and the conjugated
// form (the part the student actually types) HIGHLIGHTED — so "nous aimons" and
// "j'aime" make clear that only "aimons" / "aime" goes in the box.
function answerHTML(q, form) {
  const full   = fullAnswer(q, form);
  const prefix = full.slice(0, full.length - form.length);
  const pre    = prefix ? `<span class="ans-prefix">${escapeHTML(prefix)}</span>` : '';
  return pre + `<span class="ans-form">${escapeHTML(form)}</span>`;
}

function startQuiz() {
  state.questions = generateQuestions();
  if (state.questions.length === 0) {
    alert('Impossible de générer des questions avec ces réglages. Choisis plus de verbes ou de temps.');
    return;
  }
  state.current  = 0;
  state.correct  = 0;
  state.answered = false;
  state.results  = [];
  showScreen('quiz');
  renderQuestion();
}

function renderQuestion() {
  const q    = state.questions[state.current];
  const total = state.questions.length;

  // Progress
  $('progress-fill').style.width = (state.current / total * 100) + '%';
  $('progress-label').textContent = `${state.current + 1} / ${total}`;
  $('score-correct').textContent  = state.correct;
  $('score-total').textContent    = state.current;

  // Tense tag
  $('q-tense-tag').textContent = TENSES[q.tense].label;

  const tmeta = TENSES[q.tense];
  if (tmeta.single) {
    // No pronoun: show the infinitive big, prompt for the participle
    $('q-subject').textContent    = q.verb.infinitive;
    $('q-infinitive').textContent = '→ ' + tmeta.label.toLowerCase() + ' ?';
  } else {
    $('q-subject').textContent    = getSubject(q);
    $('q-infinitive').textContent = q.verb.infinitive;
  }
  $('q-english').textContent = $('show-english').checked
    ? '(' + q.verb.english + ')' : '';

  // Hints
  if (tmeta.compound) {
    const auxHint = q.verb.auxiliary === 'être' ? '(avec être)' : '(avec avoir)';
    $('q-english').textContent += ($('show-english').checked ? '  ' : '') + auxHint;
  } else if (tmeta.periphrastic) {
    $('q-english').textContent += ($('show-english').checked ? '  ' : '') + '(aller + infinitif)';
  }

  // Accent bar
  buildAccentBar();

  // Reset input/feedback
  const input = $('answer-input');
  input.value = '';
  input.className = '';
  input.disabled = false;
  $('feedback').className = 'feedback hidden';
  $('next-btn').className = 'btn-secondary hidden';
  $('skip-btn').classList.remove('hidden');
  $('submit-btn').disabled = false;
  state.answered = false;

  setTimeout(() => input.focus(), 50);
}

function buildAccentBar() {
  const bar = $('accent-bar');
  bar.innerHTML = '';
  if (!$('accent-keyboard').checked) return;
  for (const ch of ACCENTS) {
    const btn = document.createElement('button');
    btn.className = 'accent-btn';
    btn.textContent = ch;
    btn.type = 'button';
    btn.addEventListener('mousedown', e => {
      e.preventDefault();
      const inp = $('answer-input');
      const start = inp.selectionStart;
      const end   = inp.selectionEnd;
      inp.value = inp.value.slice(0, start) + ch + inp.value.slice(end);
      inp.selectionStart = inp.selectionEnd = start + ch.length;
      inp.focus();
    });
    bar.appendChild(btn);
  }
}

function normalise(s) {
  return s.trim().toLowerCase();
}

function checkAnswer() {
  if (state.answered) return;
  state.answered = true;

  const q          = state.questions[state.current];
  const rightForm  = getAnswer(q);
  const answer     = normalise($('answer-input').value);
  const isRight    = acceptedAnswers(q).includes(answer);

  if (isRight) state.correct++;

  // Show feedback
  const fb = $('feedback');
  fb.className = 'feedback ' + (isRight ? 'correct' : 'wrong');
  $('feedback-icon').textContent = isRight ? '✓' : '✗';
  if (isRight) {
    $('feedback-msg').textContent = 'Correct !';
  } else {
    $('feedback-msg').innerHTML = 'La réponse est : ' + answerHTML(q, rightForm);
  }

  $('answer-input').className = isRight ? 'correct' : 'wrong';
  $('answer-input').disabled  = true;
  $('submit-btn').disabled    = true;
  $('skip-btn').classList.add('hidden');
  $('next-btn').className     = 'btn-secondary';

  // Record result
  const subj  = getSubject(q);
  const label = subj
    ? `${subj} ${q.verb.infinitive} (${TENSES[q.tense].label})`
    : `${q.verb.infinitive} — ${TENSES[q.tense].label}`;
  state.results.push({
    correct: isRight,
    question: label,
    yourAnswer: answer,
    rightHtml: answerHTML(q, rightForm),
  });
}

// Skip the current question: reveal the answer, record as skipped, wait for Suivant
function skipQuestion() {
  if (state.answered) return;
  state.answered = true;

  const q         = state.questions[state.current];
  const rightForm = getAnswer(q);

  const fb = $('feedback');
  fb.className = 'feedback skipped';
  $('feedback-icon').textContent = '↷';
  $('feedback-msg').innerHTML = 'Passé — la réponse est : ' + answerHTML(q, rightForm);

  $('answer-input').disabled = true;
  $('submit-btn').disabled   = true;
  $('skip-btn').classList.add('hidden');
  $('next-btn').className     = 'btn-secondary';

  const subj  = getSubject(q);
  const label = subj
    ? `${subj} ${q.verb.infinitive} (${TENSES[q.tense].label})`
    : `${q.verb.infinitive} — ${TENSES[q.tense].label}`;
  state.results.push({
    correct: false,
    skipped: true,
    question: label,
    yourAnswer: '',
    rightHtml: answerHTML(q, rightForm),
  });
}

function advance() {
  state.current++;
  if (state.current >= state.questions.length) {
    showResults();
  } else {
    renderQuestion();
  }
}

// ─── Results screen ───────────────────────────────────────────────────────────

function showResults() {
  const total = state.results.length;
  const pct   = Math.round(state.correct / total * 100);

  $('final-correct').textContent = state.correct;
  $('final-total').textContent   = total;

  let grade;
  if (pct >= 95) grade = '🌟 Exceptionnel !';
  else if (pct >= 85) grade = '🎉 Excellent !';
  else if (pct >= 70) grade = '👍 Bien joué !';
  else if (pct >= 55) grade = '📚 Continue à t\'entraîner !';
  else grade = '💪 N\'abandonne pas — réessaie !';
  $('final-grade').textContent = `${pct}% — ${grade}`;

  const list = $('results-list');
  list.innerHTML = '';
  for (const r of state.results) {
    const cls  = r.skipped ? 'skipped' : (r.correct ? 'correct' : 'wrong');
    const icon = r.skipped ? '↷' : (r.correct ? '✓' : '✗');
    let answerHtml;
    if (r.correct) {
      answerHtml = `<span class="correct-ans">${r.rightHtml}</span>`;
    } else if (r.skipped) {
      answerHtml = `<span class="skip-note">passé</span> → <span class="correct-ans">${r.rightHtml}</span>`;
    } else {
      answerHtml = `<span class="your-ans">${escapeHTML(r.yourAnswer) || '(vide)'}</span> → <span class="correct-ans">${r.rightHtml}</span>`;
    }
    const item = document.createElement('div');
    item.className = 'result-item ' + cls;
    item.innerHTML = `
      <span class="result-icon">${icon}</span>
      <div class="result-detail">
        <div class="result-q">${r.question}</div>
        <div class="result-a">${answerHtml}</div>
      </div>
    `;
    list.appendChild(item);
  }

  showScreen('results');
}

// ─── Curriculum preset (semaines 33–34) ───────────────────────────────────────
const PRESET_VERBS = ['avoir','être','aimer','aller','manger','commencer','dire',
  'partir','venir','tenir','finir','ouvrir','rendre','prendre','mettre','devoir',
  'pouvoir','voir','savoir','vouloir','faire'];
const PRESET_TENSES = ['present','imparfait','futurSimple','conditionnelPresent',
  'imperatif','passeCompose','participePresent','participePasse','futurProche',
  'subjonctifPresent','passeSimple'];

function loadPreset() {
  // Verbs
  state.selectedVerbs = new Set(PRESET_VERBS);
  activeGroup = 'all';
  verbSearchQ = '';
  $('verb-search').value = '';
  document.querySelectorAll('#group-filter-row .group-chip')
    .forEach(c => c.classList.toggle('active', c.dataset.group === 'all'));
  renderVerbList();
  updateBadge();

  // Tenses
  state.selectedTenses = new Set(PRESET_TENSES);
  document.querySelectorAll('#tense-list input[type=checkbox]')
    .forEach(cb => { cb.checked = PRESET_TENSES.includes(cb.value); });

  updateStartBtn();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Wiring ───────────────────────────────────────────────────────────────────

function init() {
  buildTenseList();
  buildGroupFilter();
  renderVerbList();

  // Tense select all/none
  $('tense-all').addEventListener('click', () => setAllTenses(true));
  $('tense-none').addEventListener('click', () => setAllTenses(false));

  // Verb select all/none
  $('verb-all').addEventListener('click',  () => setAllVerbs(true));
  $('verb-none').addEventListener('click', () => setAllVerbs(false));

  // Verb search
  $('verb-search').addEventListener('input', e => {
    verbSearchQ = e.target.value;
    renderVerbList();
  });

  // Preset
  $('preset-btn').addEventListener('click', loadPreset);

  // Start
  $('start-btn').addEventListener('click', startQuiz);

  // Quiz
  $('submit-btn').addEventListener('click', checkAnswer);
  $('answer-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      if (state.answered) advance();
      else checkAnswer();
    }
  });
  $('next-btn').addEventListener('click', advance);
  $('skip-btn').addEventListener('click', skipQuestion);
  $('quit-btn').addEventListener('click', () => showScreen('setup'));

  // Results
  $('retry-btn').addEventListener('click', startQuiz);
  $('menu-btn').addEventListener('click',  () => showScreen('setup'));

  // Default selections: basic tenses checked, no verbs
  const defaultTenses = ['present','imparfait','futurSimple','passeCompose'];
  document.querySelectorAll('#tense-list input[type=checkbox]').forEach(cb => {
    if (defaultTenses.includes(cb.value)) {
      cb.checked = true;
      state.selectedTenses.add(cb.value);
    }
  });
  updateStartBtn();
}

document.addEventListener('DOMContentLoaded', init);
