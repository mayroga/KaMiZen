// timeline.js
let timeline = [];

function startTimeline(callbacks) {
    // Duración total ~10 minutos, subdividida en bloques
    const totalBlocks = 20;
    let currentBlock = 0;

    function nextBlock() {
        if (currentBlock < totalBlocks) {
            callbacks[currentBlock]?.();
            currentBlock++;
            setTimeout(nextBlock, 30000); // cada bloque 30s aprox
        }
    }
    nextBlock();
}
