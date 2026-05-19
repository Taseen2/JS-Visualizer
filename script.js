/**
 * ReduceFlow - JavaScript Visualizer
 * Core logic for interactive educational website.
 */

// --- Utilities ---
const Utils = {
    strip: (name) => name.replace(/^(a |the |an )/i, '').trim(),
    delay: (ms) => new Promise(r => setTimeout(r, ms)),
    save: (key, val) => localStorage.setItem(`rf-${key}`, val),
    load: (key) => localStorage.getItem(`rf-${key}`)
};

class ToastManager {
    constructor() {
        this.container = document.getElementById('toast-container');
    }

    show(message, type = 'success', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        this.container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

const toast = new ToastManager();

// --- Theme Management ---
const themeToggle = document.getElementById('theme-toggle');
const htmlElement = document.documentElement;

themeToggle.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('reduceflow-theme', newTheme);
    toast.show(`Switched to ${newTheme} mode`);
});

// Load saved theme
const savedTheme = localStorage.getItem('reduceflow-theme');
if (savedTheme) {
    htmlElement.setAttribute('data-theme', savedTheme);
}

// --- Ripple Effect ---
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('ripple')) {
        const button = e.target;
        const circle = document.createElement('span');
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${e.clientX - button.getBoundingClientRect().left - radius}px`;
        circle.style.top = `${e.clientY - button.getBoundingClientRect().top - radius}px`;
        circle.classList.add('ripple-effect');

        const ripple = button.getElementsByClassName('ripple-effect')[0];
        if (ripple) ripple.remove();

        button.appendChild(circle);
    }
});

// --- Reduce Visualizer Logic ---
class ReduceVisualizer {
    constructor() {
        this.input = document.getElementById('reduce-input');
        this.speedSlider = document.getElementById('reduce-speed');
        this.startButton = document.getElementById('start-reduce');
        this.resetButton = document.getElementById('reset-reduce');
        this.canvas = document.getElementById('reduce-canvas');
        this.accDisplay = document.getElementById('accumulator-display');
        this.statusBar = document.getElementById('reduce-status');
        this.stepCounter = document.getElementById('reduce-step-count');
        
        this.isAnimating = false;
        this.shouldStop = false;
        
        this.init();
    }

    init() {
        this.startButton.addEventListener('click', () => this.start());
        this.resetButton.addEventListener('click', () => this.reset());
    }

    async start() {
        if (this.isAnimating) return;
        
        const data = this.input.value.split(',').map(s => s.trim()).filter(Boolean);
        if (data.length === 0) return toast.show('Please enter valid strings', 'error');

        Utils.save('reduce-input', this.input.value);
        this.reset();
        this.isAnimating = true;
        this.startButton.disabled = true;

        this.canvas.innerHTML = '';
        const items = data.map(val => {
            const div = document.createElement('div');
            div.className = 'array-item';
            div.textContent = val;
            this.canvas.appendChild(div);
            return { element: div, value: val };
        });

        let acc = {};
        this.accDisplay.textContent = '{}';

        for (let i = 0; i < items.length; i++) {
            if (this.shouldStop) break;
            const item = items[i];
            const speed = 2200 - parseInt(this.speedSlider.value);

            this.statusBar.textContent = `Status: Processing "${item.value}"`;
            this.stepCounter.textContent = `Step: ${i + 1}/${data.length}`;
            item.element.classList.add('active');
            
            await Utils.delay(speed / 2);
            acc[item.value] = (acc[item.value] || 0) + 1;
            this.accDisplay.textContent = JSON.stringify(acc, null, 2);
            
            await Utils.delay(speed / 2);
            item.element.classList.replace('active', 'processed');
        }

        this.isAnimating = false;
        this.startButton.disabled = false;
        this.statusBar.textContent = 'Status: Complete!';
        toast.show('Reduce complete!');
    }
}

class SortVisualizer {
    constructor() {
        this.input = document.getElementById('sort-input');
        this.startButton = document.getElementById('start-sort');
        this.lists = {
            original: document.getElementById('original-list'),
            stripped: document.getElementById('stripped-list'),
            final: document.getElementById('final-list')
        };
        this.stepCards = document.querySelectorAll('.sort-steps .step-card');
        this.init();
    }

    init() {
        this.startButton.addEventListener('click', () => this.start());
    }

    async start() {
        const bands = this.input.value.split('\n').map(b => b.trim()).filter(Boolean);
        if (bands.length === 0) return toast.show('Please enter band names', 'error');

        Object.values(this.lists).forEach(l => l.innerHTML = '');
        this.stepCards.forEach((c, i) => i > 0 && c.classList.add('hidden'));

        bands.forEach(b => {
            const li = document.createElement('li');
            li.className = 'band-item';
            li.textContent = b;
            this.lists.original.appendChild(li);
        });

        await Utils.delay(800);
        this.showStep(1);

        bands.forEach(b => {
            const li = document.createElement('li');
            li.className = 'band-item';
            const match = b.match(/^(a |the |an )/i);
            li.innerHTML = match ? `<span class="article">${match[0]}</span>${b.slice(match[0].length)}` : b;
            this.lists.stripped.appendChild(li);
        });

        await Utils.delay(1200);
        this.showStep(2);

        [...bands].sort((a, b) => Utils.strip(a) > Utils.strip(b) ? 1 : -1).forEach(b => {
            const li = document.createElement('li');
            li.className = 'band-item';
            li.textContent = b;
            li.style.borderColor = 'var(--success)';
            this.lists.final.appendChild(li);
        });
    }

    showStep(i) {
        this.stepCards[i].classList.remove('hidden');
        this.stepCards[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function initPlaygrounds() {
    const configs = [
        { input: 'reduce-playground-input', output: 'reduce-playground-output', fn: (arr) => arr.reduce((acc, curr) => ({...acc, [curr]: (acc[curr] || 0) + 1}), {}) },
        { input: 'sort-playground-input', output: 'sort-playground-output', fn: (arr) => [...arr].sort((a, b) => Utils.strip(a) > Utils.strip(b) ? 1 : -1) }
    ];

    configs.forEach(cfg => {
        const el = document.getElementById(cfg.input);
        const out = document.getElementById(cfg.output);
        const update = () => {
            try {
                const arr = new Function(`return ${el.value}`)();
                if (!Array.isArray(arr)) throw new Error('Must be an array');
                out.textContent = JSON.stringify(cfg.fn(arr), null, 2);
                out.style.color = 'var(--success)';
            } catch (e) {
                out.textContent = `Error: ${e.message}`;
                out.style.color = 'var(--error)';
            }
        };
        el.addEventListener('input', update);
        update();
    });
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    new ReduceVisualizer();
    new SortVisualizer();
    initPlaygrounds();

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.altKey && e.key.toLowerCase() === 't') themeToggle.click();
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

        if (e.key === 'Escape') document.getElementById('reset-reduce').click();
        if (e.key === ' ' || e.key === 'Enter') {
            const reduceRect = document.getElementById('reduce-section').getBoundingClientRect();
            const sortRect = document.getElementById('sort-section').getBoundingClientRect();
            if (reduceRect.top < window.innerHeight && reduceRect.bottom > 0) {
                e.preventDefault(); document.getElementById('start-reduce').click();
            } else if (sortRect.top < window.innerHeight && sortRect.bottom > 0) {
                e.preventDefault(); document.getElementById('start-sort').click();
            }
        }
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal, .edu-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        observer.observe(el);
    });

    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const isReduce = btn.getAttribute('data-target') === 'reduce-code-pre';
            const text = document.getElementById(isReduce ? 'reduce-playground-input' : 'sort-playground-input').value;
            navigator.clipboard.writeText(text);
            toast.show('Code copied!');
        });
    });
});