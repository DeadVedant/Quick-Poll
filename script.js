/* =============================
    🌌 STARFIELD ENGINE (v1.2)
    Glow + Depth + Stable
============================= */

const canvas = document.getElementById("starfield");
const ctx = canvas.getContext("2d");

let stars = [];
let shootingStars = [];
let superComet = null;

const STAR_COUNT = 170; 

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

function resize(){
    canvas.width = innerWidth;
    canvas.height = innerHeight;
}
resize();
addEventListener("resize", resize);

addEventListener("mousemove", e=>{
    mouseX = e.clientX;
    mouseY = e.clientY;
});

class Star{
    constructor(){
        this.reset();
        this.twinkleSpeed = Math.random()*0.015 + 0.008;
        this.baseAlpha = Math.random()*0.4 + 0.35;
        this.twinkleOffset = Math.random()*Math.PI*2;
        this.glow = Math.random() < 0.18; 
        this.blinkTimer = 0;
        this.blinkInterval = Math.random()*5000 + 4000; 
        this.blinkDuration = 0;
    }

    reset(){
        this.x = Math.random()*canvas.width;
        this.y = Math.random()*canvas.height;
        this.size = Math.random()*1.6 + 0.4;
        this.speed = Math.random()*0.25 + 0.05;
    }

    update(time, deltaTime = 16){
        let dx = (mouseX - canvas.width/2) * 0.0004;
        let dy = (mouseY - canvas.height/2) * 0.0004;

        this.x += this.speed + dx;
        this.y += dy;

        if(this.x > canvas.width){
            this.x = 0;
            this.y = Math.random()*canvas.height;
        }

        let smoothTwinkle = Math.sin(time*this.twinkleSpeed + this.twinkleOffset) * 0.25;
        this.blinkTimer += deltaTime; 
        let blinkEffect = 0;

        if(this.blinkTimer > this.blinkInterval){
            this.blinkDuration += deltaTime;
            blinkEffect = -0.5; 
            if(this.blinkDuration > 120){ 
                this.blinkTimer = 0;
                this.blinkDuration = 0;
                this.blinkInterval = Math.random()*5000 + 4000;
            }
        }

        let finalAlpha = this.baseAlpha + smoothTwinkle + blinkEffect;
        this.alpha = Math.max(0.1, Math.min(1, finalAlpha));
    }

    draw(){
        ctx.beginPath();
        if(this.glow){
            ctx.shadowBlur = 12;
            ctx.shadowColor = "rgba(140,190,255,0.8)";
        }
        ctx.arc(this.x,this.y,this.size,0,Math.PI*2);
        ctx.fillStyle=`rgba(180,220,255,${this.alpha})`;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class ShootingStar{
    constructor(){
        this.x = Math.random()*canvas.width*0.8;
        this.y = Math.random()*canvas.height*0.5;
        this.len = Math.random()*80 + 60;
        this.speed = Math.random()*9 + 7;
        this.opacity = 1;
    }
    update(){
        this.x += this.speed;
        this.y += this.speed*0.6;
        this.opacity -= 0.02;
    }
    draw(){
        ctx.beginPath();
        ctx.moveTo(this.x,this.y);
        ctx.lineTo(this.x-this.len,this.y-this.len*0.6);
        ctx.strokeStyle=`rgba(200,230,255,${this.opacity})`;
        ctx.lineWidth=2;
        ctx.stroke();
    }
}

class SuperComet{
    constructor(){
        this.x = -300;
        this.y = -150;
        this.len = 320;
        this.speed = 22;
        this.opacity = 1;
    }
    update(){
        this.x += this.speed;
        this.y += this.speed*0.6;
        this.opacity -= 0.008;
    }
    draw(){
        ctx.beginPath();
        ctx.moveTo(this.x,this.y);
        ctx.lineTo(this.x-this.len,this.y-this.len*0.6);
        ctx.strokeStyle=`rgba(150,200,255,${this.opacity})`;
        ctx.lineWidth=6;
        ctx.shadowBlur=25;
        ctx.shadowColor="rgba(150,200,255,1)";
        ctx.stroke();
        ctx.shadowBlur=0;
    }
}

for(let i=0;i<STAR_COUNT;i++) stars.push(new Star());

let nextShootingStarTime = performance.now() + 3000;
let nextCometTime = performance.now() + 25000;
let lastFrameTime = performance.now();

function animate(time){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    
    const deltaTime = Math.min(time - lastFrameTime, 50); // Cap deltaTime to prevent large jumps
    lastFrameTime = time;
    
    stars.forEach(s=>{
        s.update(time*0.001, deltaTime);
        s.draw();
    });

    if(time >= nextShootingStarTime){
        if(shootingStars.length < 3) shootingStars.push(new ShootingStar());
        nextShootingStarTime = time + 3000 + Math.random()*2000;
    }

    shootingStars.forEach((s)=>{
        s.update();
        s.draw();
    });
    shootingStars = shootingStars.filter(star => star.opacity > 0);

    if(time >= nextCometTime){
        superComet = new SuperComet();
        document.body.style.filter="brightness(1.2)";
        setTimeout(()=>document.body.style.filter="brightness(1)",300);
        nextCometTime = time + 25000 + Math.random()*10000;
    }

    if(superComet){
        superComet.update();
        superComet.draw();
        if(superComet.opacity<=0) superComet=null;
    }
    requestAnimationFrame(animate);
}
animate();

/* =============================
    🔐 MODAL SYSTEM (v1.1)
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
    
    // Trigger confetti on vote submission
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#5f95e6', '#ffffff'] });
    
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
        container.innerHTML+=`
            <div class="option-block">
                <button class="option-btn"
                ${votedPolls[currentPollId]?"disabled":""}
                data-index="${i}">${o.text}</button>
                <div class="result-bar">
                    <div class="fill" id="fill-${i}" style="width: 0%"></div>
                </div>
                <div class="option-meta">${percent}% — ${o.votes} votes</div>
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
    let html="<strong>Voters:</strong><br><br>";
    let count = 0;

    poll.options.forEach(o=>{
        o.voters.forEach(name=>{
            html+=`<span style="color:#89b9ff">${name}</span> voted for "${o.text}"<br>`;
            count++;
        });
    });

    box.innerHTML = count > 0 ? html : "No votes yet.";
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