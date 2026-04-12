const ADJ = ["Swift","Calm","Wild","Lone","Bold","Shy","Neon","Fuzzy","Sly","Lucky","Quiet","Rapid","Cosmic","Silver","Rogue"];
const NOUN = ["Fox","Wolf","Panda","Tiger","Eagle","Otter","Cat","Hawk","Bee","Owl","Shark","Lynx","Bear","Moth","Crow"];

export function genUsername() {
  const a = ADJ[Math.floor(Math.random() * ADJ.length)];
  const n = NOUN[Math.floor(Math.random() * NOUN.length)];
  const num = Math.floor(Math.random() * 999);
  return `${a}${n}${num}`;
}
