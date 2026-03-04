import { generateCards } from "./generateCards";

const init = () => {
  miro.board.ui.on("icon:click", async () => {
    generateCards();
  });
};

init();