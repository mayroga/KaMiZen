let userId = null;
let sessionDuration = 600;
let timerInterval = null;

async function initSession() {

    // Unirse
    const joinRes = await fetch("/join", { method: "POST" });
    const joinData = await joinRes.json();

    if (joinData.error) {
        alert("Sesión llena.");
        return;
    }

    userId = joinData.user_id;

    loadSessionInfo();
    loadQuestion();
    loadChat();
    loadAudio();

    timerInterval = setInterval(updateTimer, 1000);
    setInterval(loadSessionInfo, 5000);
    setInterval(loadChat, 3000);
}

async function loadSessionInfo() {
    const res = await fetch("/session-info");
    const data = await res.json();

    document.getElementById("userCount").innerText = data.users;
    document.getElementById("timeRemaining").innerText = data.remaining;

    if (data.remaining <= 0) {
        clearInterval(timerInterval);
        alert("Sesión terminada.");
        location.reload();
    }
}

function updateTimer() {
    let timeElement = document.getElementById("timeRemaining");
    let current = parseInt(timeElement.innerText);
    if (current > 0) {
        timeElement.innerText = current - 1;
    }
}

async function loadQuestion() {
    const res = await fetch("/question");
    const data = await res.json();
    document.getElementById("questionBox").innerText = data.question;
}

async function sendAnswer() {
    const answer = document.getElementById("answerInput").value;

    const res = await fetch("/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: answer })
    });

    const data = await res.json();

    document.getElementById("feedback").innerText = data.feedback;
    document.getElementById("questionBox").innerText = data.next_question;
    document.getElementById("answerInput").value = "";
}

async function loadChat() {
    const res = await fetch("/chat");
    const data = await res.json();

    const chatBox = document.getElementById("chatBox");
    chatBox.innerHTML = "";

    data.messages.forEach(msg => {
        let div = document.createElement("div");
        div.innerText = msg;
        chatBox.appendChild(div);
    });
}

async function sendChat() {
    const message = document.getElementById("chatInput").value;

    await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message })
    });

    document.getElementById("chatInput").value = "";
    loadChat();
}

async function loadAudio() {
    const res = await fetch("/audio-file");
    const data = await res.json();

    const audio = document.getElementById("sessionAudio");
    audio.src = data.audio;
    audio.play();
}

window.onload = initSession;
