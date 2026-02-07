let storiesLevel2 = [
    {text:"Construyes tu primer negocio y alcanzas la libertad financiera.", lang:"es"},
    {text:"Un nuevo proyecto te lleva a conocer aliados poderosos.", lang:"es"},
    {text:"You create your first business and gain financial freedom.", lang:"en"},
    {text:"A new project introduces you to powerful allies.", lang:"en"}
];

function showStoryLevel2(){
    let s = storiesLevel2[Math.floor(Math.random()*storiesLevel2.length)];
    speakLevel2(s.text);
}
