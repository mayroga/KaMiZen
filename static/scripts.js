let protocol = location.protocol === "https:" ? "wss://" : "ws://";
let ws = new WebSocket(protocol + location.host + "/ws");

function sendAnswer(){
    let input=document.getElementById("answerInput");
    let text=input.value.trim();
    if(text==="")return;

    ws.send(JSON.stringify({
        type:"answer",
        text:text
    }));

    input.value="";
}

function skipChallenge(){
    ws.send(JSON.stringify({
        type:"skip"
    }));
}

ws.onmessage=function(event){

    let data=JSON.parse(event.data);

    if(data.type==="question"){
        document.getElementById("question").innerText=data.text;
        document.getElementById("feedback").innerText="";
    }

    if(data.type==="feedback"){
        document.getElementById("feedback").innerText=data.text;
    }

    if(data.type==="update_participants"){
        document.getElementById("participants").innerText=data.count;
    }

    if(data.type==="update_ranking"){

        let rankingDiv=document.getElementById("ranking");
        rankingDiv.innerHTML="";

        data.ranking.forEach(r=>{
            rankingDiv.innerHTML+=`<div class="rank-item">${r.name} - Nivel ${r.level}</div>`;
        });
    }

    if(data.type==="chat"){
        let chatBox=document.getElementById("chatBox");

        chatBox.innerHTML+=`<div><strong>${data.sender}:</strong> ${data.text}</div>`;

        chatBox.scrollTop=chatBox.scrollHeight;
    }

}
