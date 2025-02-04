import { COLOR_MAP } from "./constants";
const { board } = window.miro;
const generateCardObjectFor = (object, x, y) => {
  let cardColor = "#2399f3";

  if (object?.style?.fillColor) {
    const objectFillColor = object.style.fillColor;
    if (objectFillColor !== "transparent") {
      if (COLOR_MAP[objectFillColor]) {
        cardColor = COLOR_MAP[objectFillColor];
      } else {
        cardColor = objectFillColor;
      }
    }
  }
  // Add support for mind maps with text
  let title = object?.content || object?.nodeView?.content;
  const cardObject = {
    title: title,
    x: x,
    y: y,
    style: {
      cardTheme: cardColor,
    },
    tagIds: object.tagIds || [],
  };
  return cardObject;
};

export const generateCards = async () => {

  try {

    // get selected widgets
    let selectedWidgets = await board.experimental.getSelection();

    // filtering out shapes from all the selected widgets.
    selectedWidgets = selectedWidgets.filter((item) => {
      return ["shape", "text", "sticky_note", "mindmap_node", "card", "stencil"].includes(item.type); // added "card"
    });

    const cardsObjects = selectedWidgets.map((item) =>
      generateCardObjectFor(item, item.x + 800, item.y) // Added 100 to y, to stagger
    );

    const cardsGeneratedPromise = cardsObjects.map(async (card) => {
      const cardResult = board.createCard(card);
      return cardResult;
    });

    await miro.board.notifications.showInfo(
      `${selectedWidgets.length} card${selectedWidgets.length === 1 ? " was" : "s were"} successfully created!`
    );

  } catch (error) {
    console.error("Error executing Cardsy:", error);
    await miro.board.notifications.showError("An error occurred while creating cards.");
  }
};