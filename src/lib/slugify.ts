/**
 * Converte o nome do bot em um slug amigável para URL
 * Ex: "Meu Bot de Teste" -> "meu_bot_de_teste"
 */
export function slugifyBotName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, '_') // Espaços viram underscore
    .replace(/[^a-z0-9_-]/g, '') // Remove caracteres especiais
    .replace(/_+/g, '_') // Remove underscores duplicados
    .replace(/^_|_$/g, ''); // Remove underscore no início/fim
}
