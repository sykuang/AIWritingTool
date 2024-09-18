import { ipcRenderer, contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  sendOptionClicked: (optionNumber: string) => {
    ipcRenderer.send('option-clicked', optionNumber);
  },
  copyToClipboard: () => {
    ipcRenderer.send('copy-to-clipboard');
  },
  onProcessingStart: (callback: () => void) => {
    ipcRenderer.on('processing-start', callback);
  },
  onAiResponse: (callback: (event: Electron.IpcRendererEvent, response: string) => void) => {
    ipcRenderer.on('ai-response', callback);
  },
  onTextCopied: (callback: (event: Electron.IpcRendererEvent, optionNumber: string) => void) => {
    ipcRenderer.on('text-copied', callback);
  },
  onNoTextSelected: (callback: () => void) => {
    ipcRenderer.on('no-text-selected', callback);
  },
});