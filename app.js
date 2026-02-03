const STORAGE_KEY = 'streakWeekData';
const THEME_KEY = 'streakWeekTheme';

const weekGrid = document.getElementById('weekGrid');
const weeklyCount = document.getElementById('weeklyCount');
const currentStreak = document.getElementById('currentStreak');
const bestStreak = document.getElementById('bestStreak');
const weeklyTotals = document.getElementById('weeklyTotals');
const typeBreakdown = document.getElementById('typeBreakdown');
const calendarView = document.getElementById('calendarView');

const logModal = document.getElementById('logModal');
const modalDate = document.getElementById('modalDate');
const workedOutToggle = document.getElementById('workedOutToggle');
const restOptions = document.getElementById('restOptions');
const workoutDetails = document.getElementById('workoutDetails');
const workoutType = document.getElementById('workoutType');
const durationInput = document.getElementById('duration');
const intensityInput = document.getElementById('intensity');
const notesInput = document.getElementById('notes');

const themeToggle = document.getElementById('themeToggle');

let selectedDate = null;
let data = loadData();

function loadData() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getWeekDates(date = new Date()) {
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);

  return Array.from({ length: 7 }, (_, index) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + index);
    return d;
  });
}

function formatDate(date) {
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function isoDate(date) {
  return date.toISOString().split('T')[0];
}

function dayLabel(date) {
  return date.toLocaleDateString(undefined, { weekday: 'short' });
}

function workoutIcon(type) {
  const icons = {
    'Gym weights': '🏋️',
    Cardio: '❤️',
    Run: '🏃',
    Cycle: '🚴',
    Swim: '🏊',
    Sport: '🏀',
    'Yoga/Mobility': '🧘',
    'Home workout': '🏡',
    Walk: '🚶',
    Other: '✨',
  };
  return icons[type] || '➕';
}

function renderWeek() {
  const weekDates = getWeekDates();
  weekGrid.innerHTML = '';

  weekDates.forEach((date) => {
    const key = isoDate(date);
    const entry = data[key];

    const card = document.createElement('button');
    card.className = 'day-card';

    const statusText = entry?.workedOut
      ? 'Worked out'
      : entry?.restDay
      ? 'Rest day'
      : 'Not set';

    const icon = entry?.workedOut ? workoutIcon(entry.type) : entry?.restDay ? '🛌' : '➕';

    if (entry?.workedOut) {
      card.classList.add('worked');
    }
    if (entry?.restDay) {
      card.classList.add('rest');
    }

    card.innerHTML = `
      <div class="eyebrow">${dayLabel(date)} • ${formatDate(date)}</div>
      <div class="icon">${icon}</div>
      <div class="status">${statusText}</div>
      <div class="details">
        ${entry?.workedOut && entry?.duration ? `${entry.duration} min` : ''}
      </div>
    `;

    card.addEventListener('click', () => openModal(date));
    weekGrid.appendChild(card);
  });

  updateSummary();
}

function updateSummary() {
  const weekDates = getWeekDates();
  const weekCount = weekDates.filter((date) => data[isoDate(date)]?.workedOut).length;
  weeklyCount.textContent = `${weekCount}/7`;

  const streakInfo = getStreaks();
  currentStreak.textContent = `${streakInfo.current} days`;
  bestStreak.textContent = `${streakInfo.best} days`;

  renderStats();
}

function openModal(date) {
  selectedDate = date;
  const entry = data[isoDate(date)] || {};
  modalDate.textContent = `${dayLabel(date)} • ${formatDate(date)}`;

  workedOutToggle.checked = Boolean(entry.workedOut);
  workoutType.value = entry.type || '';
  durationInput.value = entry.duration || '';
  intensityInput.value = entry.intensity || '';
  notesInput.value = entry.notes || '';

  const restChoice = document.querySelector(`input[name="restChoice"][value="${entry.restDay ? 'rest' : 'blank'}"]`);
  if (restChoice) {
    restChoice.checked = true;
  }

  updateModalFields();
  logModal.classList.add('open');
  logModal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  logModal.classList.remove('open');
  logModal.setAttribute('aria-hidden', 'true');
  selectedDate = null;
}

function updateModalFields() {
  const isWorkedOut = workedOutToggle.checked;
  workoutDetails.style.display = isWorkedOut ? 'grid' : 'none';
  restOptions.style.display = isWorkedOut ? 'none' : 'flex';
}

function saveLog() {
  if (!selectedDate) return;
  const key = isoDate(selectedDate);

  if (workedOutToggle.checked) {
    data[key] = {
      workedOut: true,
      restDay: false,
      type: workoutType.value,
      duration: durationInput.value ? Number(durationInput.value) : null,
      intensity: intensityInput.value ? Number(intensityInput.value) : null,
      notes: notesInput.value.trim(),
    };
  } else {
    const restChoice = document.querySelector('input[name="restChoice"]:checked')?.value;
    if (restChoice === 'rest') {
      data[key] = { workedOut: false, restDay: true };
    } else {
      delete data[key];
    }
  }

  saveData();
  closeModal();
  renderWeek();

  const cards = document.querySelectorAll('.day-card');
  const index = getWeekDates().findIndex((date) => isoDate(date) === key);
  const card = cards[index];
  if (card) {
    card.classList.add('saved');
    setTimeout(() => card.classList.remove('saved'), 600);
  }
}

function getStreaks() {
  const dates = Object.keys(data)
    .filter((key) => data[key].workedOut)
    .sort();

  if (dates.length === 0) {
    return { current: 0, best: 0 };
  }

  let best = 1;
  let current = 0;
  let running = 1;

  for (let i = 1; i < dates.length; i += 1) {
    const prev = new Date(dates[i - 1]);
    const currentDate = new Date(dates[i]);
    const diff = (currentDate - prev) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      running += 1;
      best = Math.max(best, running);
    } else {
      running = 1;
    }
  }

  const today = new Date();
  let cursor = new Date(today);
  while (data[isoDate(cursor)]?.workedOut) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { current, best };
}

function renderStats() {
  renderWeeklyTotals();
  renderTypeBreakdown();
  renderCalendar();
}

function renderWeeklyTotals() {
  const totals = {};
  Object.keys(data).forEach((key) => {
    if (!data[key].workedOut) return;
    const date = new Date(key);
    const weekStart = isoDate(getWeekDates(date)[0]);
    totals[weekStart] = (totals[weekStart] || 0) + 1;
  });

  weeklyTotals.innerHTML = '';
  const entries = Object.entries(totals).sort((a, b) => (a[0] > b[0] ? -1 : 1));
  if (entries.length === 0) {
    weeklyTotals.innerHTML = '<li>No workouts logged yet.</li>';
    return;
  }

  entries.slice(0, 6).forEach(([weekStart, count]) => {
    const li = document.createElement('li');
    li.textContent = `${weekStart} — ${count} workouts`;
    weeklyTotals.appendChild(li);
  });
}

function renderTypeBreakdown() {
  const totals = {};
  Object.values(data).forEach((entry) => {
    if (!entry.workedOut || !entry.type) return;
    totals[entry.type] = (totals[entry.type] || 0) + 1;
  });

  typeBreakdown.innerHTML = '';
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    typeBreakdown.innerHTML = '<li>No workout types yet.</li>';
    return;
  }

  entries.forEach(([type, count]) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${type}</span><span>${count}</span>`;
    typeBreakdown.appendChild(li);
  });
}

function renderCalendar() {
  calendarView.innerHTML = '';
  const recentWeeks = [];

  const today = new Date();
  let cursor = getWeekDates(today)[0];
  for (let i = 0; i < 6; i += 1) {
    recentWeeks.push(new Date(cursor));
    cursor.setDate(cursor.getDate() - 7);
  }

  recentWeeks.forEach((weekStart) => {
    const row = document.createElement('div');
    row.className = 'calendar-week';
    getWeekDates(weekStart).forEach((date) => {
      const key = isoDate(date);
      const entry = data[key];
      const cell = document.createElement('span');
      cell.textContent = date.getDate();
      if (entry?.workedOut) cell.classList.add('worked');
      if (entry?.restDay) cell.classList.add('rest');
      row.appendChild(cell);
    });
    calendarView.appendChild(row);
  });
}

function handleTabs() {
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });
}

function handleExport() {
  const exportBtn = document.getElementById('exportData');
  exportBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'streakweek-data.json';
    link.click();
    URL.revokeObjectURL(url);
  });
}

function handleImport() {
  const importInput = document.getElementById('importData');
  importInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const parsed = JSON.parse(reader.result);
      data = parsed;
      saveData();
      renderWeek();
    };
    reader.readAsText(file);
  });
}

function handleTheme() {
  const storedTheme = localStorage.getItem(THEME_KEY);
  if (storedTheme) {
    document.documentElement.setAttribute('data-theme', storedTheme);
  }

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
  });
}

workedOutToggle.addEventListener('change', updateModalFields);

logModal.addEventListener('click', (event) => {
  if (event.target === logModal) {
    closeModal();
  }
});

document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('saveLog').addEventListener('click', saveLog);

handleTabs();
handleExport();
handleImport();
handleTheme();
renderWeek();
