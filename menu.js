window.addEventListener("DOMContentLoaded", () => {

    const embersContainer = document.querySelector(".embers");

    if (embersContainer) {
        function spawnEmber() {
            const ember = document.createElement("div");
            ember.classList.add("ember");

            const colors = ["#ff6600", "#ff3300", "#ffcc66"];
            ember.style.background = colors[Math.floor(Math.random() * colors.length)];

            ember.style.left = Math.random() * 100 + "%";

            const size = Math.random() * 4 + 3;
            ember.style.width = size + "px";
            ember.style.height = size + "px";

            const duration = Math.random() * 3 + 2;
            ember.style.animationDuration = duration + "s";

            ember.style.setProperty("--drift", Math.random());

            embersContainer.appendChild(ember);

            setTimeout(() => ember.remove(), duration * 1000);
        }

        setInterval(spawnEmber, 120);
    }

    // ENTER → PLAY
    const input = document.querySelector(".main input");
    const playBtn = document.getElementById("playBtn");

    if (input && playBtn) {
        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                playBtn.click();
            }
        });
    }
});

// OLDALAK
function goTo(page){
    window.location.href = page + ".html";
}