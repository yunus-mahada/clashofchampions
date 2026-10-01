export const animals = ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋'];

export function getAvatar(name: string) {
  // Cek apakah karakter pertama name (atau 2 char pertama untuk surrogate pairs) ada di list animals
  const firstChar = name.trim().split(' ')[0];
  if (animals.some(animal => firstChar.includes(animal) || name.startsWith(animal))) {
    // Kembalikan emoji hewan yang sudah ada di nama
    const found = animals.find(a => name.startsWith(a));
    if (found) return found;
  }

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return animals[Math.abs(hash) % animals.length];
}
