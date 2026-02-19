/* =====================================================
   🌌 STARFIELD ENGINE (Parallax + Twinkle + Shooting)
===================================================== */

const canvas = document.getElementById("starfield");
const ctx = canvas.getContext("2d");

let stars = [];
let shootingStars = [];
let superComet = null;

const STAR_COUNT = 180;

let mouseX = 0;
let mouseY = 0;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

/* Mouse Parallax */
window.addEventListener("mousemove", (e) => {
    mouseX = (e.clientX - canvas.width / 2) * 0.0008;
    mouseY = (e.clientY - canvas.height / 2) * 0.0008;
});

/* ======================
   ⭐ Stars
====================== */

class Star {
    constructor() {
        this.reset();
        this.twinkleSpeed = Math.random() * 2 + 1; // stronger speed
        this.baseAlpha = Math.random() * 0.5 + 0.3;
        this.twinkleOffset = Math.random() * Math.PI * 2;
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.8 + 0.5;
        this.speed = Math.random() * 0.25 + 0.08;
    }

    update(time) {
        this.x += this.speed;

        if (this.x > canvas.width) {
            this.x = 0;
            this.y = Math.random() * canvas.height;
        }

        // Visible smooth twinkle
        let twinkle =
            this.baseAlpha +
            Math.sin(time * this.twinkleSpeed + this.twinkleOffset) * 0.25;

        this.alpha = Math.max(0.1, Math.min(1, twinkle));
    }

    draw() {
        ctx.beginPath();
        ctx.arc(
            this.x + mouseX * this.size * 10,
            this.y + mouseY * this.size * 10,
            this.size,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = `rgba(180,220,255,${this.alpha})`;
        ctx.fill();
    }
}


/* ======================
   ☄ Normal Shooting Stars
====================== */

class ShootingStar {
    constructor() {
        this.x = Math.random() * canvas.width * 0.7;
        this.y = Math.random() * canvas.height * 0.5;
        this.len = Math.random() * 100 + 80;
        this.speed = Math.random() * 10 + 8;
        this.opacity = 1;
    }

    update() {
        this.x += this.speed;
        this.y += this.speed * 0.6;
        this.opacity -= 0.025;
    }

    draw() {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.len, this.y - this.len * 0.6);
        ctx.strokeStyle = `rgba(200,230,255,${this.opacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

/* ======================
   🌠 Super Comet (UNCHANGED)
====================== */

class SuperComet {
    constructor() {
        this.x = -300;
        this.y = -150;
        this.len = 320;
        this.speed = 22;
        this.opacity = 1;
    }

    update() {
        this.x += this.speed;
        this.y += this.speed * 0.6;
        this.opacity -= 0.008;
    }

    draw() {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.len, this.y - this.len * 0.6);
        ctx.strokeStyle = `rgba(150,200,255,${this.opacity})`;
        ctx.lineWidth = 6;
        ctx.shadowBlur = 25;
        ctx.shadowColor = "rgba(150,200,255,1)";
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}

/* Create Stars */
for (let i = 0; i < STAR_COUNT; i++) {
    stars.push(new Star());
}

/* Timing */

function randomShootingDelay() {
    return 2000 + Math.random() * 2000; // 2–4 sec
}

function randomCometDelay() {
    return 25000 + Math.random() * 10000; // 25–35 sec
}

let nextShootingStarTime = performance.now() + randomShootingDelay();
let nextCometTime = performance.now() + randomCometDelay();

/* Animation Loop */

function animate(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    stars.forEach((s) => {
        s.update(time * 0.001);
        s.draw();
    });

    if (time >= nextShootingStarTime) {
        if (shootingStars.length < 3) {
            shootingStars.push(new ShootingStar());
        }
        nextShootingStarTime = time + randomShootingDelay();
    }

    shootingStars.forEach((s, index) => {
        s.update();
        s.draw();
        if (s.opacity <= 0) {
            shootingStars.splice(index, 1);
        }
    });

    if (time >= nextCometTime) {
        superComet = new SuperComet();
        document.body.style.filter = "brightness(1.2)";
        setTimeout(() => {
            document.body.style.filter = "brightness(1)";
        }, 300);
        nextCometTime = time + randomCometDelay();
    }

    if (superComet) {
        superComet.update();
        superComet.draw();
        if (superComet.opacity <= 0) superComet = null;
    }

    requestAnimationFrame(animate);
}

animate();

/* =====================================================
   🔐 MODAL SYSTEM
===================================================== */

const overlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const modalConfirm = document.getElementById("modalConfirm");
const modalCancel = document.getElementById("modalCancel");

let modalAction = null;

function openModal(type) {
    overlay.classList.add("active");

    if (type === "reset") {
        modalTitle.innerText = "Reset Poll?";
        modalText.innerText = "This will permanently delete the poll.";
        modalConfirm.innerText = "Reset";
        modalConfirm.className = "danger";
        modalAction = resetPoll;
    } else {
        modalTitle.innerText = "Create New Poll?";
        modalText.innerText = "Current poll will be lost.";
        modalConfirm.innerText = "Create";
        modalConfirm.className = "primary";
        modalAction = createNewPoll;
    }
}

modalCancel.onclick = () => overlay.classList.remove("active");

modalConfirm.onclick = () => {
    overlay.classList.remove("active");
    if (modalAction) modalAction();
};

/* =====================================================
   🗳 POLL SYSTEM
===================================================== */

let allPolls = JSON.parse(localStorage.getItem("allPolls")) || {};
let votedPolls = JSON.parse(localStorage.getItem("votedPolls")) || {};
let currentPollId = null;

function generateId() {
    return "poll-" + Math.floor(Math.random() * 1000000);
}

function initDefaultOptions() {
    addOption();
    addOption();
}
initDefaultOptions();

function addOption() {
    const wrapper = document.createElement("div");
    wrapper.className = "option-wrapper";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "optionInput";
    input.placeholder =
        "Option " + (document.querySelectorAll(".optionInput").length + 1);

    wrapper.appendChild(input);

    if (document.querySelectorAll(".optionInput").length >= 2) {
        const remove = document.createElement("div");
        remove.className = "remove-option";
        remove.innerText = "×";
        remove.onclick = () => wrapper.remove();
        wrapper.appendChild(remove);
    }

    document.getElementById("optionInputs").appendChild(wrapper);
}

function createPoll() {
    let q = document.getElementById("question").value.trim();
    let inputs = document.querySelectorAll(".optionInput");
    let opts = [];

    inputs.forEach((i) => {
        if (i.value.trim() !== "")
            opts.push({ text: i.value, votes: 0, voters: [] });
    });

    if (q === "" || opts.length < 2)
        return alert("Enter question and at least 2 options.");

    let id = generateId();
    currentPollId = id;
    allPolls[id] = { question: q, options: opts };
    localStorage.setItem("allPolls", JSON.stringify(allPolls));

    location.hash = id;
    renderPoll();
}

function renderPoll() {
    let poll = allPolls[currentPollId];

    document.getElementById("createSection").style.display = "none";
    document.getElementById("pollSection").style.display = "block";

    document.getElementById("pollQuestion").innerText = poll.question;

    let container = document.getElementById("optionsContainer");
    container.innerHTML = "";

    let total = poll.options.reduce((s, o) => s + o.votes, 0);

    poll.options.forEach((o, i) => {
        let percent = total
            ? ((o.votes / total) * 100).toFixed(1)
            : 0;

        container.innerHTML += `
            <div>
                <button class="option-btn"
                    ${votedPolls[currentPollId] ? "disabled" : ""}
                    onclick="vote(${i})">${o.text}</button>

                <div class="result-bar">
                    <div class="fill" style="width:${percent}%"></div>
                </div>

                <div>${percent}% - ${o.votes} votes</div>
            </div>
        `;
    });

    document.getElementById("shareLink").innerText = location.href;
}

function vote(i) {
    if (votedPolls[currentPollId]) return;

    let name = prompt("Enter your name:");
    if (!name) return;

    allPolls[currentPollId].options[i].votes++;
    allPolls[currentPollId].options[i].voters.push(name);

    votedPolls[currentPollId] = true;

    localStorage.setItem("allPolls", JSON.stringify(allPolls));
    localStorage.setItem("votedPolls", JSON.stringify(votedPolls));

    renderPoll();

    if (typeof confetti === "function") {
        confetti({
            particleCount: 60,
            spread: 60,
            origin: { y: 0.6 },
        });
    }
}

function toggleVoters() {
    let box = document.getElementById("votersList");

    if (box.style.display === "block") {
        box.style.display = "none";
        box.innerHTML = "";
        return;
    }

    let poll = allPolls[currentPollId];
    let html = "<strong>Voters:</strong><br><br>";

    poll.options.forEach((o) => {
        o.voters.forEach((name) => {
            html += `${name} voted for "${o.text}"<br>`;
        });
    });

    if (html === "<strong>Voters:</strong><br><br>") {
        html += "No votes yet.";
    }

    box.innerHTML = html;
    box.style.display = "block";
}

function copyLink() {
    navigator.clipboard.writeText(location.href);

    const btn = document.getElementById("copyBtn");
    btn.innerText = "Copied!";
    setTimeout(() => (btn.innerText = "Copy Link"), 1500);
}

function shareWhatsApp() {
    window.open(
        "https://wa.me/?text=" +
            encodeURIComponent("Vote here: " + location.href),
        "_blank"
    );
}

function resetPoll() {
    delete allPolls[currentPollId];
    delete votedPolls[currentPollId];
    localStorage.setItem("allPolls", JSON.stringify(allPolls));
    localStorage.setItem("votedPolls", JSON.stringify(votedPolls));
    location.reload();
}

function createNewPoll() {
    location.hash = "";
    location.reload();
}

function loadFromHash() {
    let hash = location.hash.substring(1);
    if (hash && allPolls[hash]) {
        currentPollId = hash;
        renderPoll();
    }
}
loadFromHash();
