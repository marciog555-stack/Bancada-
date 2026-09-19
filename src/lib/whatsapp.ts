export function linkWhatsApp(numero: string): string {
  const digitos = numero.replace(/\D/g, '')
  const comDdi = digitos.startsWith('55') ? digitos : `55${digitos}`
  return `https://wa.me/${comDdi}`
}
