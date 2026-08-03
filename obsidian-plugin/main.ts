import { Plugin, TFile, TFolder, Notice, normalizePath, PluginSettingTab, Setting } from 'obsidian';

interface JYWorkstationSyncSettings {
  watchFolder: string;
  targetFolder: string;
  archiveAfterImport: boolean;
  archiveFolder: string;
}

const DEFAULT_SETTINGS: JYWorkstationSyncSettings = {
  watchFolder: 'JY_Workstation/_inbox',
  targetFolder: 'JY_Workstation',
  archiveAfterImport: true,
  archiveFolder: 'JY_Workstation/_archive',
};

export default class JYWorkstationSync extends Plugin {
  settings: JYWorkstationSyncSettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: 'import-workstation-export',
      name: 'Import workstation export files',
      callback: () => this.importExports(),
    });

    this.addCommand({
      id: 'open-workstation-url',
      name: 'Open JY Workstation in browser',
      callback: () => {
        window.open('https://yapjunyit-lgtm.github.io/jy-workstation/', '_blank');
      },
    });

    this.addSettingTab(new JYWorkstationSettingTab(this.app, this));

    new Notice('JY Workstation Sync loaded');
  }

  async importExports() {
    const { watchFolder, targetFolder, archiveAfterImport, archiveFolder } = this.settings;
    const targetPath = normalizePath(targetFolder);

    const targetFolderObj = this.app.vault.getAbstractFileByPath(targetPath);
    if (!targetFolderObj) {
      await this.app.vault.createFolder(targetPath);
    }

    const watchFolderObj = this.app.vault.getAbstractFileByPath(normalizePath(watchFolder));
    if (!watchFolderObj || !(watchFolderObj instanceof TFolder)) {
      new Notice(`Watch folder "${watchFolder}" not found. Create it and add exported .md files.`);
      return;
    }

    const files = (watchFolderObj as TFolder).children;
    let imported = 0;

    for (const file of files) {
      if (file instanceof TFile && file.extension === 'md') {
        const content = await this.app.vault.read(file);

        if (content.includes('source: jy-workstation')) {
          const targetFilePath = normalizePath(`${targetPath}/${file.name}`);
          const existing = this.app.vault.getAbstractFileByPath(targetFilePath);

          if (existing instanceof TFile) {
            await this.app.vault.modify(existing, content);
          } else {
            await this.app.vault.create(targetFilePath, content);
          }

          if (archiveAfterImport) {
            const archivePath = normalizePath(archiveFolder);
            if (!this.app.vault.getAbstractFileByPath(archivePath)) {
              await this.app.vault.createFolder(archivePath);
            }
            const archiveFilePath = normalizePath(`${archivePath}/${file.name}`);
            await this.app.vault.rename(file, archiveFilePath);
          }

          imported++;
        }
      }
    }

    new Notice(`Imported ${imported} workstation note${imported !== 1 ? 's' : ''}`);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class JYWorkstationSettingTab extends PluginSettingTab {
  plugin: JYWorkstationSync;

  constructor(app: any, plugin: JYWorkstationSync) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'JY Workstation Sync Settings' });
    containerEl.createEl('p', { text: 'Export from the workstation web app, place .md files in the watch folder, then run the import command.' });
  }
}
