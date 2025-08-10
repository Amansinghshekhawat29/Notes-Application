/* ----------------- Utilities ----------------- */
const qs = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));

/* Elements */
const notesListEl = qs('#notesList');
const titleEl = qs('#noteTitle');
const tagsEl = qs('#noteTags');
const contentEl = qs('#noteContent');
const addBtn = qs('#addBtn');
const exportBtn = qs('#exportBtn');
const clearBtn = qs('#clearBtn');
const searchEl = qs('#searchInput');
const themeToggle = qs('#themeToggle');

const editModal = qs('#editModal');
const editTitle = qs('#editTitle');
const editTags = qs('#editTags');
const editContent = qs('#editContent');
const saveEditBtn = qs('#saveEdit');
const cancelEditBtn = qs('#cancelEdit');

const confettiCanvas = qs('#confettiCanvas');
const ctx = confettiCanvas.getContext('2d');
let confettiActive = false;

/* ----------------- State ----------------- */
let notes = JSON.parse(localStorage.getItem('notes') || '[]');
let editingIndex = -1;

/* ----------------- Theme ----------------- */
function applyThemeFromStorage() {
  const theme = localStorage.getItem('theme') || 'dark';
  document.body.classList.toggle('light', theme === 'light');
  // animate toggle icon
  themeToggle.style.transform = theme === 'light' ? 'rotate(40deg) scale(1.03)' : 'none';
}
themeToggle.addEventListener('click', () => {
  const isLight = !document.body.classList.toggle('light');
  // Actually toggle 'light' class
  document.body.classList.toggle('light');
  localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
  themeToggle.animate([{ transform: 'rotate(0) scale(1)' }, { transform: 'rotate(10deg) scale(1.05)' }, { transform: 'rotate(0) scale(1)' }], { duration: 420 });
});
applyThemeFromStorage();

/* ----------------- Notes CRUD ----------------- */
function saveNotes() {
  localStorage.setItem('notes', JSON.stringify(notes));
}

function parseTags(text) {
  return text.split(',')
    .map(t => t.trim().toLowerCase())
    .filter(t => t.length);
}

function createNoteObject(title, content, tagsArr) {
  return {
    id: Date.now() + Math.floor(Math.random()*9999),
    title,
    content,
    tags: tagsArr,
    createdAt: new Date().toISOString()
  };
}

function addNote() {
  const title = titleEl.value.trim();
  const content = contentEl.value.trim();
  const tags = parseTags(tagsEl.value || '');
  if (!title || !content) {
    // small non-blocking highlight
    addBtn.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-6px)' }, { transform: 'translateY(0)' }], { duration: 300 });
    return alert('Please enter both title and content.');
  }
  notes.unshift(createNoteObject(title, content, tags));
  saveNotes();
  renderNotes();
  // reset
  titleEl.value = '';
  tagsEl.value = '';
  contentEl.value = '';
  shotConfetti();
  animateButton(addBtn);
}

addBtn.addEventListener('click', addNote);

/* Delete */
function deleteNote(index) {
  if (!confirm('Delete this note?')) return;
  notes.splice(index, 1);
  saveNotes();
  renderNotes();
}

/* Clear all */
clearBtn.addEventListener('click', () => {
  if (!notes.length) return;
  if (!confirm('Clear all notes?')) return;
  notes = [];
  saveNotes();
  renderNotes();
});

/* Edit flow */
function openEdit(index) {
  editingIndex = index;
  const n = notes[index];
  editTitle.value = n.title;
  editTags.value = n.tags.join(', ');
  editContent.value = n.content;
  showModal();
}
function saveEdit() {
  if (editingIndex < 0) return;
  notes[editingIndex].title = editTitle.value.trim();
  notes[editingIndex].tags = parseTags(editTags.value || '');
  notes[editingIndex].content = editContent.value.trim();
  saveNotes();
  renderNotes();
  hideModal();
}
saveEditBtn.addEventListener('click', saveEdit);
cancelEditBtn.addEventListener('click', hideModal);

function showModal(){
  editModal.classList.add('show');
  editModal.setAttribute('aria-hidden', 'false');
}
function hideModal(){
  editModal.classList.remove('show');
  editModal.setAttribute('aria-hidden', 'true');
  editingIndex = -1;
}

/* Export */
exportBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `notes-export-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  animateButton(exportBtn);
});

/* ----------------- Render ----------------- */
function renderNotes(filter = '') {
  notesListEl.innerHTML = '';
  const q = filter.trim().toLowerCase();

  notes.forEach((note, idx) => {
    if (q) {
      const inTitle = note.title.toLowerCase().includes(q);
      const inContent = note.content.toLowerCase().includes(q);
      const inTags = note.tags.join(' ').includes(q);
      if (!(inTitle || inContent || inTags)) return;
    }
    const card = document.createElement('article');
    card.className = 'note-card';
    card.innerHTML = `
      <div class="card-actions">
        <button class="icon-btn" title="Edit" data-action="edit">✏️</button>
        <button class="icon-btn" title="Delete" data-action="delete">❌</button>
      </div>
      <h3>${escapeHtml(note.title)}</h3>
      <p>${escapeHtml(note.content)}</p>
      <div class="tags">${note.tags.map(t => `<span class="tag">#${escapeHtml(t)}</span>`).join('')}</div>
    `;

    // action handlers
    const editBtn = card.querySelector('[data-action="edit"]');
    editBtn.addEventListener('click', () => openEdit(idx));
    const delBtn = card.querySelector('[data-action="delete"]');
    delBtn.addEventListener('click', () => deleteNote(idx));

    notesListEl.appendChild(card);
  });

  // if no notes
  if (!notes.length) {
    notesListEl.innerHTML = `<div class="note-card" style="text-align:center; opacity:.9;">No notes yet — add a new note to get started ✨</div>`;
  }
}

/* Search */
searchEl.addEventListener('input', (e) => {
  renderNotes(e.target.value);
});

/* Helpers */
function escapeHtml(s='') {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function animateButton(el){
  el.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-6px)' }, { transform: 'translateY(0)' }], { duration: 380 });
}

/* ----------------- Confetti (simple) ----------------- */
let confettiParticles = [];
function resizeCanvas(){
  confettiCanvas.width = innerWidth;
  confettiCanvas.height = innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function shotConfetti(){
  // small burst
  confettiParticles = [];
  const count = 60;
  for (let i=0;i<count;i++){
    confettiParticles.push({
      x: innerWidth/2 + (Math.random()-0.5)*200,
      y: innerHeight/3 + (Math.random()-0.5)*60,
      vx: (Math.random()-0.5)*8,
      vy: (Math.random()*-6)-2,
      r: Math.random()*7+4,
      life: Math.random()*60+60,
      color: `hsl(${Math.random()*360},80%,60%)`
    });
  }
  if (!confettiActive) {
    confettiActive = true;
    requestAnimationFrame(confettiLoop);
    setTimeout(()=> confettiActive = false, 2000);
  }
}

function confettiLoop(){
  ctx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);
  confettiParticles.forEach((p, i) => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.25; // gravity
    p.life--;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.r*0.6, p.r*0.9, Math.sin(p.life/10), 0, Math.PI*2);
    ctx.fill();
    if (p.y > innerHeight+50 || p.life <= 0) confettiParticles.splice(i,1);
  });
  if (confettiParticles.length) requestAnimationFrame(confettiLoop);
}

/* ----------------- Init ----------------- */
function init() {
  renderNotes();
  // keyboard shortcut: Ctrl+Enter to add
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') addNote();
    if (e.key === 'Escape') hideModal();
  });
}
init();
