import { app, BrowserWindow, globalShortcut, ipcMain, screen, clipboard, Tray, Menu } from 'electron';
import * as path from 'path';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { exec } from 'child_process';
import * as util from 'util';
// Load environment variables
dotenv.config();

// Auto-reload for development
if (process.env.NODE_ENV === 'development') {
    require('electron-reloader')(module);
}

let optionsWindow: BrowserWindow | null = null;
let resultsWindow: BrowserWindow | null = null;
let mainWindow: BrowserWindow | null = null;
let aiResponse: string = '';
// Access the Azure OpenAI API details
const API_KEY = process.env.AZURE_OPENAI_API_KEY;
const API_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const DEPLOYMENT_NAME = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
function createTray(): void {
    let tray: Tray = new Tray('icon.png');
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Exit', click: () => app.quit() }
    ]);
    tray.setToolTip('Text Selection Monitor');
    tray.setContextMenu(contextMenu);
}

function createMainWindow(): void {
    mainWindow = new BrowserWindow({
        width: 0,
        height: 0,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    mainWindow.loadFile(path.join(__dirname, '../src/index.html'));
    console.log('Main window created');
}

function createOptionsWindow(): void {
    optionsWindow = new BrowserWindow({
        width: 300,
        height: 400,
        frame: false,
        transparent: true,
        resizable: false,
        show: false,
        webPreferences: {
            //   nodeIntegration: true,
            //   contextIsolation: false,
            preload: path.join(__dirname, "preload.js"),
        },
    });

    optionsWindow.loadFile(path.join(__dirname, '../src/options.html'));

    optionsWindow.on('blur', () => {
        optionsWindow?.hide();
    });
}
function createResultsWindow(): void {
    resultsWindow = new BrowserWindow({
        width: 900,
        height: 400,
        frame: false,
        transparent: true,
        resizable: false,
        show: false,
        webPreferences: {
            //   nodeIntegration: true,
            //   contextIsolation: false,
            preload: path.join(__dirname, "preload.js"),
        },
    });

    resultsWindow.loadFile(path.join(__dirname, '../src/results.html'));
    resultsWindow.on('blur', () => {
        resultsWindow?.hide();
    });
}
function showOptionsWindow(): void {
    const { x, y } = screen.getCursorScreenPoint();
    const currentDisplay = screen.getDisplayNearestPoint({ x, y });

    optionsWindow?.setPosition(
        Math.floor(x - 150 + currentDisplay.bounds.x),
        Math.floor(y - 200 + currentDisplay.bounds.y)
    );
    optionsWindow?.show();
    optionsWindow?.focus();
    optionsWindow?.setAlwaysOnTop(true);
}
function showResultsWindow(): void {
    const { x, y } = screen.getCursorScreenPoint();
    const currentDisplay = screen.getDisplayNearestPoint({ x, y });

    resultsWindow?.setPosition(
        Math.floor(x - 150 + currentDisplay.bounds.x),
        Math.floor(y - 200 + currentDisplay.bounds.y)
    );
    resultsWindow?.show();
    resultsWindow?.focus();
}
async function callAzureOpenAI(prompt: string): Promise<string> {
    if (!API_KEY || !API_ENDPOINT || !DEPLOYMENT_NAME) {
        throw new Error('Azure OpenAI API configuration is missing');
    }

    const url = `${API_ENDPOINT}/openai/deployments/${DEPLOYMENT_NAME}/chat/completions?api-version=2023-05-15`;

    try {
        const response = await axios.post(url, {
            messages: [{ role: "user", content: prompt }],
            max_tokens: 800,
            temperature: 0.7,
        }, {
            headers: {
                'Content-Type': 'application/json',
                'api-key': API_KEY,
            },
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error calling Azure OpenAI API:', error);
        return 'Error: Unable to get a response from the AI.';
    }
}
function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
app.whenReady().then(() => {
    createMainWindow();
    createOptionsWindow();
    createResultsWindow();
    globalShortcut.register('CommandOrControl+Shift+Space', async () => {
        if (optionsWindow?.isVisible()) {
            optionsWindow.hide();
        } else {
            setTimeout(() => {
                exec(path.join(__dirname, './arm64/copy.exe'), (err, stdout, stderr) => {
                    if (err) {
                        // node couldn't execute the command
                        console.log(err);
                        return;
                    }

                    // the *entire* stdout and stderr (buffered)
                    console.log(clipboard.readText());
                    showOptionsWindow();

                });
            }, 1000);
        }
    });
    createTray();
});

ipcMain.on('option-clicked', async (event, optionNumber: string) => {
    console.log(`Option ${optionNumber} clicked`);

    const selectedText = clipboard.readText();

    if (selectedText) {
        console.log('Selected text:', selectedText);
        let template: string = '';
        if (optionNumber === '1') {
            template = `Improve the text in triple below in your own words. Rephrase the text. \
                            """
                            %s
                            """
                            Do not return anything other than the rephrased text. Do not wrap responses in quotes.`

        }
        else if (optionNumber === '2') {

        }
        else if (optionNumber === '3') {
            template = `Summarize the text in triple quotes but keep it concise. Summarize using plain and simple language and keep the same tense.
"""
%s
"""
Do not return anything other than the summary. Do not wrap responses in quotes.`;
        }
        else if (optionNumber === '4') {
            template = `Translate the text to English in triple quotes but keep it concise. Translation using plain and simple language and keep the same tense.
"""
%s
"""
Do not return anything other than the summary. Do not wrap responses in quotes.`;

        }
        else if (optionNumber === '5') {
            template = `Translate the text to Traditional Chinese in triple quotes but keep it concise. Translation using plain and simple language and keep the same tense.
"""
%s
"""
Do not return anything other than the summary. Do not wrap responses in quotes.`;
        }
        const prompt = util.format(template, selectedText);
        console.log('Prompt:', prompt);

        optionsWindow?.hide();
        resultsWindow?.webContents.send('processing-start');
        showResultsWindow();
        aiResponse = await callAzureOpenAI(prompt);

        resultsWindow?.webContents.send('ai-response', aiResponse);
    } else {
        console.log('No text selected');
        event.reply('no-text-selected');
    }
});
ipcMain.on('copy-to-clipboard', () => {
    clipboard.writeText(aiResponse);
    console.log('AI response copied to clipboard');
    resultsWindow?.hide();
});
app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});