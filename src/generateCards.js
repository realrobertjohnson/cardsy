import { COLOR_MAP } from "./constants";
const { board } = window.miro;
const generateCardObjectFor = (object, x, y) => {
  let cardColor = "#2399f3";
  
  if(object?.style?.fillColor) {
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

  // get selected widgets
  let selectedWidgets = await board.experimental.getSelection();

  // filtering out shapes from all the selected widgets.
  selectedWidgets = selectedWidgets.filter((item) => {
    return ["shape", "text", "sticky_note", "mindmap_node", "card"].includes(item.type); // added "card"
  });

  const cardsObjects = selectedWidgets.map((item) =>
    generateCardObjectFor(item, item.x + 800, item.y)
  );

  const cardsGeneratedPromise = cardsObjects.map(async (card) => {
    const cardResult = board.createCard(card);
    return cardResult;
  });
};