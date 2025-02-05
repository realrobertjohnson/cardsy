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

    if (selectedWidgets.length === 0) {
      await miro.board.notifications.showError("No objects selected. Select something and try again.");
      return;
    }

    // filtering out shapes from all the selected widgets.
    selectedWidgets = selectedWidgets.filter((item) => {
      return ["shape", "text", "sticky_note", "mindmap_node", "card", "stencil"].includes(item.type); // added "card"
    });

    const newCards = [];

    const cardsObjects = selectedWidgets.map((item) =>
      generateCardObjectFor(item, item.x + 800, item.y)
    );

    const cardsGeneratedPromise = cardsObjects.map(async (card) => {
      const cardResult = await board.createCard(card); // Wait for the card to be created
      newCards.push(cardResult); // Store the result in newCards
      return cardResult;
    });

    await Promise.all(cardsGeneratedPromise); // Ensure all cards are created before proceeding

    await miro.board.deselect();
    await miro.board.select({ id: newCards.map(f => f.id) });

    // const cardsObjects = selectedWidgets.map((item) =>
    //   generateCardObjectFor(item, item.x + 800, item.y)

    // );

    // const cardsGeneratedPromise = cardsObjects.map(async (card) => {
    //   const cardResult = board.createCard(card);
    //   return cardResult;
    // });

    await miro.board.notifications.showInfo(
      `${selectedWidgets.length} card${selectedWidgets.length === 1 ? " was" : "s were"} successfully created!`
    );

  } catch (error) {
    console.error("Error executing Cardsy:", error);
    await miro.board.notifications.showError("An error occurred while creating cards.");
  }
};