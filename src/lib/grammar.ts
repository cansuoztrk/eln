/**
 * Turkish case endings for names, so sentences stay correct whoever they are
 * about: "Eln'in" but "Arda'nın", "Eln'den" but "Arda'dan".
 */

const BACK = "aıou";
const ROUND = "ouöü";
const VOWELS = "aeıioöuü";
const VOICELESS = "fstkçşhp";

function analyse(name: string) {
  const letters = [...name.toLocaleLowerCase("tr-TR")].filter((c) => /\p{L}/u.test(c));
  const lastVowel = [...letters].reverse().find((c) => VOWELS.includes(c)) ?? "e";
  const last = letters[letters.length - 1] ?? "e";
  return { back: BACK.includes(lastVowel), round: ROUND.includes(lastVowel), endsWithVowel: VOWELS.includes(last), voiceless: VOICELESS.includes(last) };
}

/** ı / i / u / ü, chosen by vowel harmony. */
function high(name: string): string {
  const { back, round } = analyse(name);
  return back ? (round ? "u" : "ı") : round ? "ü" : "i";
}

/** "Eln'in", "Arda'nın" */
export function genitive(name: string): string {
  return `${name}'${analyse(name).endsWithVowel ? "n" : ""}${high(name)}n`;
}

/** "Eln'e", "Arda'ya" */
export function dative(name: string): string {
  const { back, endsWithVowel } = analyse(name);
  return `${name}'${endsWithVowel ? "y" : ""}${back ? "a" : "e"}`;
}

/** "Eln'den", "Arda'dan" */
export function ablative(name: string): string {
  const { back, voiceless } = analyse(name);
  return `${name}'${voiceless ? "t" : "d"}${back ? "a" : "e"}n`;
}

/** "Eln'i", "Arda'yı" */
export function accusative(name: string): string {
  return `${name}'${analyse(name).endsWithVowel ? "y" : ""}${high(name)}`;
}
