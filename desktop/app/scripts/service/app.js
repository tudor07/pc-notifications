import { app, BrowserWindow } from 'electron';
import path from 'path';
import url from 'url';
import datastore from 'nedb-promise';
import { Server } from './Server.js';
import { ipcMain } from 'electron';
import {SettingsDao} from './SettingsDao.js'

let win

let settingsStore = datastore({filename: app.getPath('userData') + '/settings.json', autoload: true})
console.log(app.getPath('userData') + '/settings.json');
let settingsDao = new SettingsDao({settingsStore});
let server = new Server(settingsDao);

function createWindow() {
        win = new BrowserWindow({ width: 1920, height: 1080 })

        win.loadURL(url.format({
            pathname: path.join(__dirname, '../../index.html'),
            protocol: 'file:',
            slashes: true
        }))

        win.on('closed', () => {
            win = null
        })

        win.webContents.on('did-finish-load', () => {
            server.setOnClientConnected(() => {
                console.log('win.send - client_connected');
                win.webContents.send('client_connected');
            }); 

            server.setOnSmsListReceived((smsList) => {
                win.webContents.send('sms_list_response', smsList);
            });

            server.setOnNewSmsReceived((sms) => {
                win.webContents.send('new_sms', sms);
            });

            server.setOnContactListReceived((contactList) => {
                win.webContents.send('contact_list_response', JSON.parse(contactList));
            });

            ipcMain.on('retrieve_qrcode', async (event, arg) => {
                let qrcode = await server.getQrCodeValue();
                event.sender.send('qrcode_found', qrcode);
            });

            ipcMain.on('retrieve_sms', async (event, arg) => {
                console.log('ipcMain - retrieve_sms');
                server.getSmsList();
            });

            ipcMain.on('send_sms', async (event, sms) => {
                console.log('send_sms', sms);
                server.sendSms(sms, (response) => {
                    console.log('send back: ', response);
                    event.sender.send('send_sms_response', response);
                });
            });

            ipcMain.on('retrieve_contacts', async (event, arg) => {
                console.log('ipcMain - retrieve_contacts');
                server.getContactList();
            });

            server.startServer();
        });
    }

app.on('ready', createWindow)

app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow()
    }
})