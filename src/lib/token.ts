/** Token aleatório e seguro (Web Crypto) para links públicos — não sequencial, não previsível. */
export function gerarTokenSeguro(bytes = 24): string {
  const valores = crypto.getRandomValues(new Uint8Array(bytes));
  let binario = "";
  valores.forEach((b) => (binario += String.fromCharCode(b)));
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
