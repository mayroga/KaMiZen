function adaptVisualsLevel2(hour){
    if(hour>=6 && hour<12) canvasLevel2.style.background="linear-gradient(to top,#FFFAAA,#FFEEDD)";
    else if(hour>=12 && hour<18) canvasLevel2.style.background="linear-gradient(to top,#87CEFA,#00BFFF)";
    else canvasLevel2.style.background="linear-gradient(to top,#2C3E50,#34495E)";
}

setInterval(()=>adaptVisualsLevel2(new Date().getHours()), 60000);
