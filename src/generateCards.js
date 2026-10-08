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

const getParent = async (item) => {
  // Mind map nodes are only reachable through the experimental API
  if (item.type === "mindmap_node") {
    const [parent] = await miro.board.experimental.get({ id: [item.parentId] });
    return parent;
  }
  return miro.board.getById(item.parentId);
};

// Child items report x/y relative to their parent (frame top-left corner, or
// parent mind map node centre), so convert them to board coordinates.
const getBoardPosition = async (item) => {
  if (!item.parentId || !item.relativeTo || item.relativeTo === "canvas_center") {
    return { x: item.x, y: item.y };
  }

  const parent = await getParent(item);
  if (!parent) {
    return { x: item.x, y: item.y };
  }

  const parentPos = await getBoardPosition(parent);
  if (item.relativeTo === "parent_top_left") {
    return {
      x: parentPos.x - (parent.width || 0) / 2 + item.x,
      y: parentPos.y - (parent.height || 0) / 2 + item.y,
    };
  }
  // parent_center
  return { x: parentPos.x + item.x, y: parentPos.y + item.y };
};

const getSelectionBounds = async (items) => {
  const boxes = await Promise.all(
    items.map(async (item) => {
      const { x, y } = await getBoardPosition(item);
      const halfW = (item.width || 0) / 2;
      const halfH = (item.height || 0) / 2;
      return { left: x - halfW, right: x + halfW, top: y - halfH, bottom: y + halfH };
    })
  );
  return {
    left: Math.min(...boxes.map((b) => b.left)),
    right: Math.max(...boxes.map((b) => b.right)),
    top: Math.min(...boxes.map((b) => b.top)),
    bottom: Math.max(...boxes.map((b) => b.bottom)),
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

    if (selectedWidgets.length === 0) {
      await miro.board.notifications.showError("None of the selected objects can be converted to cards.");
      return;
    }

    // Place the grid just to the right of the selection, top-aligned with it
    const bounds = await getSelectionBounds(selectedWidgets);
    // TEMP: debug card placement
    console.log(
      "Cardsy selection:",
      selectedWidgets.map(({ type, x, y, width, height, parentId, relativeTo }) => ({
        type, x, y, width, height, parentId, relativeTo,
      })),
      "bounds:",
      bounds
    );
    const originX = bounds.right + GRID_GAP + CARD_WIDTH / 2;
    const originY = bounds.top + CARD_HEIGHT / 2;

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