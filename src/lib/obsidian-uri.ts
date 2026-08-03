export const ObsidianURI = {
  openNote(vaultName: string, filename: string): void {
    const uri = `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(filename)}`;
    window.open(uri, '_blank');
  },

  createNote(vaultName: string, filename: string, markdownContent: string): void {
    const truncated = markdownContent.length > 1500
      ? markdownContent.slice(0, 1500) + '\n\n*(content truncated)*'
      : markdownContent;

    const uri = `obsidian://new?vault=${encodeURIComponent(vaultName)}&name=${encodeURIComponent(filename)}&content=${encodeURIComponent(truncated)}`;
    window.open(uri, '_blank');
  },

  appendToDailyNote(vaultName: string, date: string, content: string): void {
    const uri = `obsidian://adv-uri?vault=${encodeURIComponent(vaultName)}&filepath=${encodeURIComponent(date)}&data=${encodeURIComponent('\n' + content)}&mode=append`;
    window.open(uri, '_blank');
  },

  isObsidianAvailable(): boolean {
    // We can't truly detect this from a browser, so we just fire the URI
    // and rely on the browser's protocol handler
    return true;
  },
};
