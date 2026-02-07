function askUserQuestionLevel2(){
    let q = lang==="es"?"¿Qué deseas lograr hoy?":"What do you want to achieve today?";
    let answer = prompt(q);
    if(answer) speakLevel2(lang==="es"?`Excelente, enfocarte en ${answer}`:`Excellent, focusing on ${answer}`);
}
