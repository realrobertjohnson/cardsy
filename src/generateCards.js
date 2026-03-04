import { COLOR_MAP } from "./constants";

const CARD_WIDTH = 320;
const CARD_HEIGHT = 180;
const GRID_COLUMNS = 4;
const GRID_GAP = 50;

const generateCardObjectFor = (object, x, y) => {
  let cardColor = "#2399f3";

  if (object?.style?.fillColor) {
    const objectFillColor = object.style.fillColor;
    if (objectFillColor !== "transparent") {
      cardColor = COLOR_MAP[objectFillColor] || objectFillColor;
    }
  }

  const title = object?.content || object?.nodeView?.content;

  return {
    title,
    x,
    y,
    style: {
      cardTheme: cardColor,
    },
    tagIds: object.tagIds || [],
  };
};

const createCards = async (cardObjects) => {
  const newCards = [];
  await Promise.all(
    cardObjects.map(async (card) => {
      const cardResult = await miro.board.createCard(card);
      newCards.push(cardResult);
    })
  );
  return newCards;
};

export const generateCards = async () => {
  try {
    let selectedWidgets = await miro.board.experimental.getSelection();

    if (selectedWidgets.length === 0) {
      await miro.board.notifications.showError("No objects selected. Select something and try again.");
      return;
    }

    const supportedTypes = ["shape", "text", "sticky_note", "mindmap_node", "card", "stencil"];
    selectedWidgets = selectedWidgets.filter((item) => supportedTypes.includes(item.type));

    // Use the first selected item as the grid origin
    const originX = selectedWidgets[0].x + 800;
    const originY = selectedWidgets[0].y;

    const cardObjects = selectedWidgets.map((item, index) => {
      const col = index % GRID_COLUMNS;
      const row = Math.floor(index / GRID_COLUMNS);
      const x = originX + col * (CARD_WIDTH + GRID_GAP);
      const y = originY + row * (CARD_HEIGHT + GRID_GAP);
      return generateCardObjectFor(item, x, y);
    });

    const newCards = await createCards(cardObjects);

    await miro.board.deselect({ id: selectedWidgets.map((w) => w.id) });
    await miro.board.select({ id: newCards.map((c) => c.id) });

    await miro.board.viewport.zoomTo(newCards);

    const currentViewport = await miro.board.viewport.get();
    await miro.board.viewport.set({
      viewport: currentViewport,
      padding: {
        top: 100,
        bottom: 100,
        left: 100,
        right: 100,
      },
      animationDurationInMs: 300,
    });

    await miro.board.notifications.showInfo(
      `${selectedWidgets.length} card${selectedWidgets.length === 1 ? " was" : "s were"} successfully created!`
    );
  } catch (error) {
    console.error("Error executing Cardsy:", error);
    await miro.board.notifications.showError("An error occurred while creating cards.");
  }
};