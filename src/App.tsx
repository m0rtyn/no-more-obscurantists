import { Component, createEffect, createSignal } from "solid-js";
import styles from "./App.module.css";
import { SwipeCard } from "solid-swipe-card";
import {
  Configuration,
  CreateCompletionRequestPrompt,
  OpenAIApi,
} from "openai";

const OPENAI_API_KEY = "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";

/**
 * 1. Генерит рандомную карту таро
 * 2. Под картой появляется текст от GPT-3
 * 3. Юзер свайпает карту, снова выбирается случайная карта и появляется продолжение предсказания
 * 4. Повторяем это, а спустя три-пять карт появляется полный текст предсказания.
 */

const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

interface Card {
  name: string;
  imgUrl: string;
}
const TAROT_CARDS: Card[] = [
  { name: "The Fool", imgUrl: "https://randomtarotcard.com/TheFool.jpg" },
  {
    name: "The Magician",
    imgUrl: "https://randomtarotcard.com/TheMagician.jpg",
  },
  {
    name: "The High Priestess",
    imgUrl: "https://randomtarotcard.com/TheHighPriestess.jpg",
  },
  { name: "The Empress", imgUrl: "https://randomtarotcard.com/TheEmpress.jpg" },
  { name: "The Emperor", imgUrl: "https://randomtarotcard.com/TheEmperor.jpg" },
  {
    name: "The Hierophant",
    imgUrl: "https://randomtarotcard.com/TheHierophant.jpg",
  },
  { name: "The Lovers", imgUrl: "https://randomtarotcard.com/TheLovers.jpg" },
  { name: "The Chariot", imgUrl: "https://randomtarotcard.com/TheChariot.jpg" },
  { name: "Strength", imgUrl: "https://randomtarotcard.com/Strength.jpg" },
  { name: "The Hermit", imgUrl: "https://randomtarotcard.com/TheHermit.jpg" },
  {
    name: "Wheel of Fortune",
    imgUrl: "https://randomtarotcard.com/WheelofFortune.jpg",
  },
  { name: "Justice", imgUrl: "https://randomtarotcard.com/Justice.jpg" },
  {
    name: "The Hanged Man",
    imgUrl: "https://randomtarotcard.com/TheHangedMan.jpg",
  },
  { name: "Death", imgUrl: "https://randomtarotcard.com/Death.jpg" },
  { name: "Temperance", imgUrl: "https://randomtarotcard.com/Temperance.jpg" },
  { name: "The Devil", imgUrl: "https://randomtarotcard.com/TheDevil.jpg" },
  { name: "The Tower", imgUrl: "https://randomtarotcard.com/TheTower.jpg" },
  { name: "The Star", imgUrl: "https://randomtarotcard.com/TheStar.jpg" },
  { name: "The Moon", imgUrl: "https://randomtarotcard.com/TheMoon.jpg" },
  { name: "The Sun", imgUrl: "https://randomtarotcard.com/TheSun.jpg" },
  { name: "Judgement", imgUrl: "https://randomtarotcard.com/Judgement.jpg" },
  { name: "The World", imgUrl: "https://randomtarotcard.com/TheWorld.jpg" },
];

const getRandomCards = (size = 1) => {
  return new Array(size).fill(0).map(() => {
    const randomIndex = Math.floor(Math.random() * TAROT_CARDS.length);
    return TAROT_CARDS[randomIndex];
  });
};

const generatePrompt = (cards: Card[]): CreateCompletionRequestPrompt => {
  return `Please read the Tarot cards for me. Here are the cards I've been dealt: ${cards
    .map((c) => c.name)
    .join(", ")}. What do they mean?`;
};

const App: Component = () => {
  const [cards, setCards] = createSignal<Card[]>([]);
  const [choosenCards, setChoosenCards] = createSignal<Card[]>([]);

  const [completion, setCompletion] = createSignal<string>("");
  const [loading, setLoading] = createSignal<boolean>(false);
  const [error, setError] = createSignal<boolean>(false);

  queueMicrotask(() => {
    const initialCards = getRandomCards(3);
    setCards(initialCards);
  });

  const handleSwipe = (direction: string) => {
    console.log("swipe", direction);
    if (direction === "up" || direction === "down") {
      return;
    }

    const [choosenCard, ...rest] = cards();
    setCards(rest);
    if (direction === "left") {
      return;
    }

    setChoosenCards([...choosenCards(), choosenCard]);
  };

  const sendPrompt = () => {
    console.debug("🚀 ~ sendPrompt ~ prompt");
    const prompt = generatePrompt(choosenCards());

    setLoading(true);
    const completion = openai
      .createCompletion({
        model: "text-davinci-003",
        prompt,
        max_tokens: 2000, // the max number of tokens to generate
        temperature: 0, // a measure of randomness
        top_p: 1.0, // the probability of choosing the next token
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
      })
      .then((completion) => {
        setCompletion(completion?.data?.choices?.[0]?.text || "No answer 🤷‍♂️");
        setLoading(false);
      })
      .catch((err) => {
        setError(true);
        console.error(err);
      });
    // console.debug('🔮: ', completion.data.choices[0].text)
  };

  return (
    <div class={styles.App}>
      <header class={styles.header}>
        <h1>No more Obsurantists!</h1>
      </header>

      <main>
        <div class={styles.deck}>
          {cards().map((card) => (
            <SwipeCard
              onSwipe={handleSwipe}
              onSnapBack={() => console.log("snap back")}
              class={styles.card}
              // treshold={100000}
            >
              <img src={card.imgUrl} />
            </SwipeCard>
          ))}
        </div>

        <button
          type="button"
          class={styles.sendPromptButton}
          disabled={choosenCards().length < 1}
          onClick={sendPrompt}
        >
          Send prompt
        </button>

        {choosenCards().map((card) => (
          <div class={[styles.card, styles.choosenCard].join(" ")}>
            <img src={card.imgUrl} />
          </div>
        ))}

        <div>
          {loading() ? "Loading..." : ""}
          {completion().length > 0 && (
            <ul class="prediction">
              {completion().replace(/^\n\n/, "")
                .split("\n\n")
                .map((line) => (
                  <li>{line}</li>
                ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
