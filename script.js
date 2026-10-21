// Local Storage Keys
const PROJECTS_KEY = 'claude_hub_projects';
const NOTES_KEY = 'claude_hub_notes';
const LOGS_KEY = 'claude_hub_logs';

// Speech Synthesis Setup (VOZ)
function speak(text) {
    if (!window.speechSynthesis) {
        console.error('Síntese de voz não suportada neste navegador.');
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';

    // Tenta encontrar uma voz feminina no sistema
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice =>
        (voice.name.includes('Maria') || voice.name.includes('Heloisa') || voice.name.includes('Google português do Brasil') || voice.name.includes('Female'))
        && voice.lang.includes('pt')
    );

    if (femaleVoice) {
        utterance.voice = femaleVoice;
    }

    utterance.pitch = 1.1; // Ajusta o tom para ficar levemente mais feminino/suave
    utterance.rate = 1.0;  // Velocidade normal
    window.speechSynthesis.speak(utterance);
}

// Speech Recognition Setup (OUVIDO)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let isListening = false;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleVoiceCommand(transcript);
    };

    recognition.onend = () => {
        isListening = false;
        document.getElementById('voice-status').classList.add('hidden');
        document.getElementById('voice-btn').classList.remove('bg-red-500');
        document.getElementById('voice-btn').classList.add('bg-blue-600');
    };

    recognition.onerror = (event) => {
        console.error('Erro no reconhecimento de voz:', event.error);
        isListening = false;
        document.getElementById('voice-status').classList.add('hidden');
    };
}

function toggleVoice() {
    if (!recognition) {
        alert('Seu navegador não suporta reconhecimento de voz. Tente usar o Google Chrome.');
        return;
    }

    if (isListening) {
        recognition.stop();
    } else {
        recognition.start();
        isListening = true;
        document.getElementById('voice-status').classList.remove('hidden');
        document.getElementById('voice-btn').classList.remove('bg-blue-600');
        document.getElementById('voice-btn').classList.add('bg-red-500');
    }
}

function handleVoiceCommand(text) {
    addLog(`Comando de voz recebido: "${text}"`);

    // Copia automaticamente para o clipboard para você colar no Claude Code
    navigator.clipboard.writeText(text).then(() => {
        speak(`Eu ouvi: ${text}. O texto já está copiado para você colar no Claude.`);
    });

    if (text.toLowerCase().includes('novo projeto')) {
        speak('Abrindo tela de novo projeto.');
        openModal();
    } else if (text.toLowerCase().includes('notas')) {
        speak('Indo para suas notas.');
        showSection('notes');
    } else if (text.toLowerCase().includes('projetos')) {
        speak('Mostrando seus projetos.');
        showSection('projects');
    } else if (text.toLowerCase().includes('logs')) {
        speak('Abrindo o log de atividades.');
        showSection('logs');
    }
}

// Initial Data
let projects = JSON.parse(localStorage.getItem(PROJECTS_KEY)) || [

    { id: 1, name: 'Interface Visual', desc: 'Dashboard para interagir com o Claude Code', status: 'Em andamento' }
];

let notes = JSON.parse(localStorage.getItem(NOTES_KEY)) || [];
let logs = JSON.parse(localStorage.getItem(LOGS_KEY)) || [
    { date: new Date().toLocaleDateString(), text: 'Interface criada com sucesso!' }
];

// Section Management
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));
    document.getElementById(sectionId).classList.remove('hidden');
}

// Modal Management
function openModal() { document.getElementById('modal').classList.remove('hidden'); }
function closeModal() { document.getElementById('modal').classList.add('hidden'); }

// Project Logic
function saveProject() {
    const name = document.getElementById('proj-name').value;
    const desc = document.getElementById('proj-desc').value;

    if (!name) return alert('Por favor, insira o nome do projeto');

    const newProj = {
        id: Date.now(),
        name,
        desc,
        status: 'Em andamento'
    };

    projects.push(newProj);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));

    renderProjects();
    closeModal();
    addLog(`Novo projeto criado: ${name}`);
}

function renderProjects() {
    const grid = document.getElementById('project-grid');
    grid.innerHTML = projects.map(p => `
        <div class="project-card bg-slate-800 border border-slate-700 p-5 rounded-xl hover:border-blue-500">
            <div class="flex justify-between items-start mb-3">
                <h3 class="text-lg font-bold">${p.name}</h3>
                <span class="text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded-full">${p.status}</span>
            </div>
            <p class="text-slate-400 text-sm mb-4">${p.desc}</p>
            <div class="flex gap-2">
                <button class="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded transition">Ver Detalhes</button>
                <button onclick="deleteProject(${p.id})" class="text-xs text-red-400 hover:text-red-300 px-3 py-1 transition">Excluir</button>
            </div>
        </div>
    `).join('');
}

function deleteProject(id) {
    projects = projects.filter(p => p.id !== id);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    renderProjects();
}

// Notes Logic
function addNote() {
    const input = document.getElementById('note-input');
    if (!input.value) return;

    notes.push({
        id: Date.now(),
        text: input.value,
        date: new Date().toLocaleDateString()
    });

    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    input.value = '';
    renderNotes();
    addLog('Nova nota adicionada');
}

function renderNotes() {
    const list = document.getElementById('notes-list');
    list.innerHTML = notes.map(n => `
        <div class="bg-slate-800 p-4 rounded-lg border border-slate-700 group relative">
            <p class="text-slate-300 text-sm">${n.text}</p>
            <span class="text-[10px] text-slate-500 block mt-2">${n.date}</span>
            <button onclick="deleteNote(${n.id})" class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition">
                <i class="fas fa-trash text-xs"></i>
            </button>
        </div>
    `).join('');
}

function deleteNote(id) {
    notes = notes.filter(n => n.id !== id);
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    renderNotes();
}

// Log Logic
function addLog(text) {
    logs.unshift({
        date: new Date().toLocaleString(),
        text: text
    });
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
    renderLogs();
}

function renderLogs() {
    const logDiv = document.getElementById('activity-log');
    logDiv.innerHTML = logs.map(l => `
        <div class="flex gap-4 text-sm border-l-2 border-slate-600 pl-4 py-1">
            <span class="text-slate-500 whitespace-nowrap">${l.date}</span>
            <span class="text-slate-300">${l.text}</span>
        </div>
    `).join('');
}

// Init
window.onload = () => {
    renderProjects();
    renderNotes();
    renderLogs();
};
