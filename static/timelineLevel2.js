let timelineEventsLevel2 = [
    {time:1, action:()=>speakLevel2(lang==="es"?"Un nuevo amanecer te recibe.":"A new dawn greets you.")},
    {time:3, action:()=>speakLevel2(lang==="es"?"Observa tu camino y los desafíos que encontrarás.":"Observe your path and the challenges ahead.")},
    {time:5, action:()=>speakLevel2(lang==="es"?"Cada decisión influye en tu bienestar futuro.":"Each decision affects your future wellbeing.")}
];

function startTimelineLevel2(){
    timelineEventsLevel2.forEach(ev => {
        setTimeout(ev.action, ev.time*1000);
    });
}
