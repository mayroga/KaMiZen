function resetAvatarLevel2(){
    avatarLevel2.x = 50;
    avatarLevel2.y = canvasLevel2.height - 50;
    avatarLevel2.color = "green";
    currentTargetLevel2 = 0;
}

function avatarReactLevel2(action){
    if(action==='respirar') avatarLevel2.color='lightblue';
    else if(action==='estirarse') avatarLevel2.color='orange';
    else if(action==='cerrarOjos') avatarLevel2.color='purple';
}
