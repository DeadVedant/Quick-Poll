/* =========================
   ADVANCED CINEMATIC STARFIELD
========================= */

const canvas = document.getElementById("starfield");
const ctx = canvas.getContext("2d");

let stars = [];
let shootingStars = [];
const STAR_COUNT = 150;

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

    requestAnimationFrame(animateStars);
}

animateStars();




/* =========================
       POLL LOGIC
========================= */

let allPolls=JSON.parse(localStorage.getItem("allPolls"))||{};
let votedPolls=JSON.parse(localStorage.getItem("votedPolls"))||{};
let currentPollId=null;

function generateId(){return "poll-"+Math.floor(Math.random()*1000000);}

function addOption(){
    let count=document.querySelectorAll(".optionInput").length;
    if(count>=4){alert("Maximum 4 options allowed");return;}
    let input=document.createElement("input");
    input.type="text";
    input.className="optionInput";
    input.placeholder="Option "+(count+1);
    document.getElementById("optionInputs").appendChild(input);
}

function createPoll(){
    let question=document.getElementById("question").value.trim();
    let inputs=document.querySelectorAll(".optionInput");
    let options=[];
    inputs.forEach(input=>{
        if(input.value.trim()!==""){
            options.push({text:input.value.trim(),votes:0,voters:[]});
        }
    });

    if(question===""||options.length<2){
        alert("Enter question and at least 2 options.");
        return;
    }

    let id=generateId();
    currentPollId=id;
    allPolls[id]={question,options};
    localStorage.setItem("allPolls",JSON.stringify(allPolls));
    window.location.hash=id;
    renderPoll();
}

function renderPoll(){
    let poll=allPolls[currentPollId];
    document.getElementById("createSection").style.display="none";
    document.getElementById("pollSection").style.display="block";
    document.getElementById("pollQuestion").innerText=poll.question;

    let container=document.getElementById("optionsContainer");
    container.innerHTML="";
    let total=poll.options.reduce((s,o)=>s+o.votes,0);

    poll.options.forEach((option,index)=>{
        let percent=total===0?0:((option.votes/total)*100).toFixed(1);
        container.innerHTML+=`
            <div>
                <button class="option-btn"
                ${votedPolls[currentPollId]?"disabled":""}
                onclick="vote(${index})">${option.text}</button>
                <div class="result-wrapper">
                    <div class="result-bar">
                        <div class="fill" style="width:${percent}%"></div>
                    </div>
                    <div class="result-text">
                        <span>${percent}%</span>
                        <span>${option.votes} votes</span>
                    </div>
                </div>
            </div>
        `;
    });

    document.getElementById("shareLink").innerText=window.location.href;
}

function vote(index){
    if(votedPolls[currentPollId]){alert("You already voted!");return;}
    let name=prompt("Enter your name:");
    if(!name||name.trim()===""){alert("Name required!");return;}

    allPolls[currentPollId].options[index].votes++;
    allPolls[currentPollId].options[index].voters.push(name.trim());
    votedPolls[currentPollId]=true;

    localStorage.setItem("allPolls",JSON.stringify(allPolls));
    localStorage.setItem("votedPolls",JSON.stringify(votedPolls));

    renderPoll();
    confetti({particleCount:100,spread:80,origin:{y:0.6}});
    document.getElementById("voteSound").play();
}

function toggleVoters(){
    let box=document.getElementById("votersList");
    if(box.style.display==="block"){
        box.style.display="none";
        box.innerHTML="";
        return;
    }

    let poll=allPolls[currentPollId];
    let html="<strong>Voters:</strong><br><br>";

    poll.options.forEach(option=>{
        option.voters.forEach(name=>{
            html+=`${name} voted for "${option.text}"<br>`;
        });
    });

    if(html==="<strong>Voters:</strong><br><br>"){html+="No votes yet.";}

    box.innerHTML=html;
    box.style.display="block";
}

function copyLink(){
    navigator.clipboard.writeText(window.location.href);
    alert("Link Copied!");
}

function shareWhatsApp(){
    let text="Vote in this poll: "+window.location.href;
    window.open("https://wa.me/?text="+encodeURIComponent(text),"_blank");
}

function resetPoll(){
    delete allPolls[currentPollId];
    delete votedPolls[currentPollId];
    localStorage.setItem("allPolls",JSON.stringify(allPolls));
    localStorage.setItem("votedPolls",JSON.stringify(votedPolls));
    window.location.hash="";
    location.reload();
}

function createNewPoll(){
    window.location.hash="";
    location.reload();
}

function loadFromHash(){
    let hash=window.location.hash.substring(1);
    if(hash&&allPolls[hash]){
        currentPollId=hash;
        renderPoll();
    }
}
loadFromHash();
