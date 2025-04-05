const { app, BrowserWindow, ipcMain } = require('electron')
const {connect} = require('./database/db')
const profileService = require('./database/profileService')
const {runAndSaveProfile, auto} = require('./chrome/crprofile')

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

function createWindow () {
  const win = new BrowserWindow({
    width: 1485,
    height: 800,
    autoHideMenuBar: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true,
    }
  })

  win.loadFile('src/html/index.html')
}

app.whenReady().then(async () => {
  await connect()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('RunAndSaveProfile', async (event, locateProfile) => {
  await runAndSaveProfile(locateProfile)
})

ipcMain.handle('GetProfileByID', async (event, id) => {
  return await profileService.getProfileByID(id)
})

ipcMain.handle('UpdateProfile', async (event, id, newProfile) => {
  return await profileService.updateProfile(id, newProfile)
})

ipcMain.handle('DeleteProfile', async (event, id) => {
  return await profileService.deleteProfile(id)
})

ipcMain.handle('GetAllProfile', async (event, page, limit) => {
  let result = await profileService.getAllProfile(page, limit)
  return result
})

ipcMain.handle('AddNewProfile', async (event, newProfile) => {
  return await profileService.addNewProfile(newProfile)
})

ipcMain.handle('AutoPost', async (event, locateProfile, base, listPost) => {
  await auto(locateProfile, base, listPost)
})

ipcMain.handle('SearchProfile', async (event, key) => {
  return await profileService.searchProfile(key)
})