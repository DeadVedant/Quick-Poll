/* =========================
   ADVANCED CINEMATIC STARFIELD
========================= */

const canvas = document.getElementById("starfield");
const ctx = canvas.getContext("2d");

let stars = [];
let shootingStars = [];
let rareComets = [];
const STAR_COUNT = 150;

let lastCometTime = Date.now();
let nextCometInterval = getRandomCometInterval();

function getRandomCometInterval() {
    return Math.random() * 5000 + 15000;
}

let mouseX = 0;
let mouseY = 0;

function resizeCanvas(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

/* ========= STAR CLASS ========= */

class Star{
    constructor(){
        this.reset();
    }

    reset(){
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.8 + 0.4;
        this.depth = Math.random() * 0.8 + 0.2;
        this.speed = this.depth * 0.15; // faster drift
        this.baseAlpha = Math.random() * 0.6 + 0.3;
        this.twinkleSpeed = Math.random() * 0.02 + 0.01;
        this.twinkleOffset = Math.random() * Math.PI * 2;
    }

    update(){
        // Horizontal drift
        this.x += this.speed;

        if(this.x > canvas.width){
            this.x = 0;
            this.y = Math.random() * canvas.height;
        }
    }

    draw(time){
        const parallaxX = (mouseX - canvas.width/2) * this.depth * 0.03;
        const parallaxY = (mouseY - canvas.height/2) * this.depth * 0.03;

        // Twinkling effect
        const alpha = this.baseAlpha + 
            Math.sin(time * this.twinkleSpeed + this.twinkleOffset) * 0.3;

        ctx.beginPath();
        ctx.arc(this.x + parallaxX, this.y + parallaxY, this.size, 0, Math.PI*2);
        ctx.fillStyle = `rgba(180,220,255,${alpha})`;
        ctx.fill();
    }
}

/* ========= SHOOTING STAR CLASS ========= */

class ShootingStar{
    constructor(){
        this.reset();
    }

    reset(){
        this.x = Math.random() * canvas.width * 0.5;
        this.y = Math.random() * canvas.height * 0.5;
        this.length = Math.random() * 100 + 60;
        this.speed = Math.random() * 10 + 8;
        this.size = 2;
        this.opacity = 1;
        this.active = true;
    }

    update(){
        this.x += this.speed;
        this.y += this.speed * 0.5;
        this.opacity -= 0.02;

        if(this.opacity <= 0){
            this.active = false;
        }
    }

    draw(){
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.length, this.y - this.length * 0.5);
        ctx.strokeStyle = `rgba(255,255,255,${this.opacity})`;
        ctx.lineWidth = this.size;
        ctx.stroke();
    }
}

/* ========= RARE BLUE COMET CLASS ========= */

class RareBlueComet{
    constructor(){
        this.reset();
    }

    reset(){
        this.x = -200; 
        this.y = Math.random() * (canvas.height * 0.5); 
        this.length = Math.random() * 400 + 300; 
        this.speed = Math.random() * 8 + 6; 
        this.angle = Math.random() * 0.2 + 0.1; 
        this.size = Math.random() * 2 + 3;
        this.opacity = 0; // Starts invisible
        this.fadeIn = true;
        this.active = true;
    }

    update(){
        this.x += this.speed;
        this.y += this.speed * this.angle;
        
        if (this.fadeIn) {
            this.opacity += 0.01;
            if (this.opacity >= 1) {
                this.opacity = 1;
                this.fadeIn = false;
            }
        } else if (this.x > canvas.width * 0.8) {
            this.opacity -= 0.01;
        }

        if(this.opacity <= 0 && !this.fadeIn || this.x > canvas.width + this.length){
            this.active = false;
        }
    }

    draw(){
        ctx.save();
        
        let pulse = Math.sin(Date.now() * 0.015) * 0.5 + 0.5;
        let tailX = this.x - this.length;
        let tailY = this.y - (this.length * this.angle);

        // Outer wide glowing tail
        let tailGlow = ctx.createLinearGradient(this.x, this.y, tailX, tailY);
        tailGlow.addColorStop(0, `rgba(0, 150, 255, ${this.opacity * 0.4})`);
        tailGlow.addColorStop(1, `rgba(0, 20, 100, 0)`);
        
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = tailGlow;
        ctx.lineWidth = this.size * 4;
        ctx.lineCap = "round";
        ctx.stroke();

        // Inner bright core tail
        let tailCore = ctx.createLinearGradient(this.x, this.y, tailX, tailY);
        tailCore.addColorStop(0, `rgba(180, 230, 255, ${this.opacity})`);
        tailCore.addColorStop(0.3, `rgba(50, 150, 255, ${this.opacity * 0.8})`);
        tailCore.addColorStop(1, `rgba(0, 0, 255, 0)`);
        
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = tailCore;
        ctx.lineWidth = this.size;
        ctx.stroke();
        
        // Glowing comet head
        ctx.shadowBlur = 20 + pulse * 15;
        ctx.shadowColor = `rgba(0, 180, 255, ${this.opacity})`;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.fill();
        
        // Extra inner star sparkle on head
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 240, 255, ${this.opacity})`;
        ctx.fill();

        ctx.restore();
    }
}

/* ========= INIT ========= */

for(let i=0;i<STAR_COUNT;i++){
    stars.push(new Star());
}

window.addEventListener("mousemove",(e)=>{
    mouseX = e.clientX;
    mouseY = e.clientY;
});

/* ========= ANIMATION LOOP ========= */

function animateStars(time = 0){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Update and draw stars
    stars.forEach(star=>{
        star.update();
        star.draw(time);
    });

    // Increase shooting star frequency
    if(Math.random() < 0.01){  // more frequent now
        shootingStars.push(new ShootingStar());
    }

    // Update shooting stars
    shootingStars.forEach((s, index)=>{
        s.update();
        s.draw();

        if(!s.active){
            shootingStars.splice(index,1);
        }
    });

    // Handle Rare Blue Comet spawning
    let currentTime = Date.now();
    if(currentTime - lastCometTime > nextCometInterval){
        rareComets.push(new RareBlueComet());
        lastCometTime = currentTime;
        nextCometInterval = getRandomCometInterval();
    }

    // Update and draw rare comets
    rareComets.forEach((c, index)=>{
        c.update();
        c.draw();

        if(!c.active){
            rareComets.splice(index, 1);
        }
    });

    requestAnimationFrame(animateStars);
}

animateStars();




/* =========================
   🗳 QUICKPOLL FUNCTIONALITY
============================= */

const overlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const modalConfirm = document.getElementById("modalConfirm");
const modalCancel = document.getElementById("modalCancel");
const modalInput = document.getElementById("modalInput");

let modalAction = null;
let pendingVoteIndex = null;

function openModal(type, customMsg = ""){
    overlay.classList.add("active");
    modalInput.style.display="none";
    modalInput.value="";
    modalCancel.style.display="inline-block";

    if(type==="reset"){
        modalTitle.innerText="Reset Poll?";
        modalText.innerText="This will permanently delete the poll.";
        modalConfirm.innerText="Reset";
        modalConfirm.classList.remove("primary","danger");
        modalConfirm.classList.add("danger");
        modalAction=resetPoll;
    }
    else if(type==="new"){
        modalTitle.innerText="Create New Poll?";
        modalText.innerText="Current poll will be lost.";
        modalConfirm.innerText="Create";
        modalConfirm.classList.remove("primary","danger");
        modalConfirm.classList.add("primary");
        modalAction=createNewPoll;
    }
    else if(type==="vote"){
        modalTitle.innerText="Enter Your Name";
        modalText.innerText="";
        modalConfirm.innerText="Submit Vote";
        modalConfirm.classList.remove("primary","danger");
        modalConfirm.classList.add("primary");
        modalInput.style.display="block";
        modalInput.focus();
        modalAction=submitVote;
    }
    else if(type==="error"){
        modalTitle.innerText="Oops!";
        modalText.innerText=customMsg;
        modalConfirm.innerText="Got it";
        modalConfirm.classList.remove("primary","danger");
        modalConfirm.classList.add("primary");
        modalCancel.style.display="none"; // Only one button for errors
        modalAction=()=>overlay.classList.remove("active");
    }
}

modalCancel.onclick=()=> overlay.classList.remove("active");
modalConfirm.onclick=()=> { if(modalAction) modalAction(); };

function submitVote(){
    const name = modalInput.value.trim();
    if(!name) return;
    overlay.classList.remove("active");
    allPolls[currentPollId].options[pendingVoteIndex].votes++;
    allPolls[currentPollId].options[pendingVoteIndex].voters.push(name);
    votedPolls[currentPollId]=true;
    localStorage.setItem("allPolls",JSON.stringify(allPolls));
    localStorage.setItem("votedPolls",JSON.stringify(votedPolls));
    
    // White glowy confetti
    confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#e0e7ff', '#f5f3ff', '#ffffff']
    });
    confetti({
        particleCount: 50,
        spread: 120,
        origin: { x: 0.1, y: 0.3 },
        colors: ['#e0e7ff', '#f5f3ff']
    });
    confetti({
        particleCount: 50,
        spread: 120,
        origin: { x: 0.9, y: 0.3 },
        colors: ['#e0e7ff', '#f5f3ff']
    });
    
    renderPoll();
}

/* =============================
    🗳 POLL SYSTEM
============================= */

let allPolls=JSON.parse(localStorage.getItem("allPolls"))||{};
let votedPolls=JSON.parse(localStorage.getItem("votedPolls"))||{};
let currentPollId=null;

function generateId(){return "poll-"+Math.floor(Math.random()*1000000);}

function initDefaultOptions(){
    addOption();
    addOption();
}
if(!location.hash) initDefaultOptions();

function addOption(){
    const wrapper=document.createElement("div");
    wrapper.className="option-wrapper";
    const input=document.createElement("input");
    input.type="text";
    input.className="optionInput";
    input.placeholder="Option "+(document.querySelectorAll(".optionInput").length+1);
    wrapper.appendChild(input);

    if(document.querySelectorAll(".optionInput").length>=2){
        const remove=document.createElement("div");
        remove.className="remove-option";
        remove.innerText="×";
        wrapper.appendChild(remove);
    }
    document.getElementById("optionInputs").appendChild(wrapper);
}

function createPoll(){
    let q=document.getElementById("question").value.trim();
    let inputs=document.querySelectorAll(".optionInput");
    let opts=[];

    inputs.forEach(i=>{
        if(i.value.trim()!=="") opts.push({text:i.value,votes:0,voters:[]});
    });

    if(q===""||opts.length<2){
        const container = document.querySelector(".container");
        container.classList.add("shake");
        setTimeout(()=>container.classList.remove("shake"), 400);
        openModal("error", "Please enter a question and at least 2 options.");
        return;
    }

    let id=generateId();
    currentPollId=id;
    allPolls[id]={question:q,options:opts};
    localStorage.setItem("allPolls",JSON.stringify(allPolls));
    location.hash=id;
    renderPoll();
}

function renderPoll(){
    let poll=allPolls[currentPollId];
    if(!poll) return;
    
    document.getElementById("createSection").style.display="none";
    document.getElementById("pollSection").style.display="block";
    document.getElementById("pollQuestion").innerText=poll.question;

    let container=document.getElementById("optionsContainer");
    container.innerHTML="";
    let total=poll.options.reduce((s,o)=>s+o.votes,0);

    poll.options.forEach((o,i)=>{
        let percent=total?((o.votes/total)*100).toFixed(1):0;
        const isVoted = votedPolls[currentPollId];
        container.innerHTML+=`
            <div class="option-block">
                <div class="option-header">
                    <div class="option-name">${o.text}</div>
                    <div class="option-meta">${percent}% (${o.votes})</div>
                </div>
                <button class="option-btn ${isVoted ? 'voted' : ''}"
                    ${isVoted ? "disabled" : ""}
                    data-index="${i}">
                    ${isVoted ? '✓ Voted' : 'Vote'}
                </button>
                <div class="result-bar">
                    <div class="fill" id="fill-${i}" style="width: 0%"></div>
                </div>
            </div>
        `;
        // Trigger animation after a tiny delay so the DOM can catch up
        setTimeout(() => {
            const fillBar = document.getElementById(`fill-${i}`);
            if(fillBar) fillBar.style.width = percent + "%";
        }, 50);
    });

    document.getElementById("shareLink").innerText=location.href;
}

function vote(i){
    if(votedPolls[currentPollId]) return;
    pendingVoteIndex=i;
    openModal("vote");
}

function toggleVoters(){
    let box=document.getElementById("votersList");
    if(box.style.display==="block"){
        box.style.display="none";
        return;
    }

    let poll=allPolls[currentPollId];
    let html="";
    let count = 0;

    poll.options.forEach(o=>{
        o.voters.forEach(name=>{
            html += `<div style="padding: 8px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.15);">👤 <strong>${name}</strong> voted for <span style="color: #e0e7ff">"${o.text}"</span></div>`;
            count++;
        });
    });

    box.innerHTML = count > 0 ? html : "No votes yet";
    box.style.display="block";
}

function copyLink(){
    navigator.clipboard.writeText(location.href);
    const btn=document.getElementById("copyBtn");
    btn.innerText="Copied!";
    setTimeout(()=>btn.innerText="Copy Link",1500);
}

function shareWhatsApp(){
    window.open("https://wa.me/?text="+encodeURIComponent("Vote in my QuickPoll: "+location.href));
}

function resetPoll(){
    delete allPolls[currentPollId];
    delete votedPolls[currentPollId];
    localStorage.setItem("allPolls",JSON.stringify(allPolls));
    location.hash = "";
    location.reload();
}

function createNewPoll(){
    location.hash="";
    location.reload();
}

function loadFromHash(){
    let hash=location.hash.substring(1);
    if(hash&&allPolls[hash]){
        currentPollId=hash;
        renderPoll();
    }
}
window.onhashchange = loadFromHash;
loadFromHash();

/* =============================
   🎯 CENTRALIZED EVENT DELEGATION
============================= */

document.addEventListener("click", (event) => {
    const target = event.target;
    const action = target.getAttribute("data-action");
    
    if(!action) {
        // Handle remove option button
        if(target.classList.contains("remove-option")) {
            target.closest(".option-wrapper").remove();
        }
        // Handle option button clicks for voting
        if(target.classList.contains("option-btn") && 
           target.getAttribute("data-index") !== null &&
           !target.disabled) {
            const index = parseInt(target.getAttribute("data-index"));
            vote(index);
        }
        return;
    }
    
    // Handle data-action buttons
    switch(action) {
        case "addOption":
            addOption();
            break;
        case "createPoll":
            createPoll();
            break;
        case "toggleVoters":
            toggleVoters();
            break;
        case "copyLink":
            copyLink();
            break;
        case "shareWhatsApp":
            shareWhatsApp();
            break;
        case "resetPoll":
            openModal("reset");
            break;
        case "createNewPoll":
            openModal("new");
            break;
    }
});
