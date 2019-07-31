export function localeToLanguage(locale: string): string {
  locale = locale.toLowerCase();
  locale = locale.replace("_", "-");
  const parts = locale.split("-");
  if (parts.length > 0) {
    return parts[0];
  }
  return "";
}
