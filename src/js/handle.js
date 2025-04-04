const axios = require('axios')
const { ipcRenderer } = require("electron")

const addNewProfile = async (newProfile) => {
    await ipcRenderer.invoke('AddNewProfile', newProfile)
    return true
}

const searchProfile = async (key) => {
    return await ipcRenderer.invoke('SearchProfile', key)
}

const getAllProfile = async (page, limit) => {
    let result = await ipcRenderer.invoke('GetAllProfile', page, limit)
    return result
}

const getProfileById = async (id) => {
    let result = await ipcRenderer.invoke('GetProfileByID', id)
    return result
}

const deleteProfileByID = async (id) => {
    let result = await ipcRenderer.invoke('DeleteProfile', id)
    return result
}

const updateProfileByID = async (id, newProfile) => {
    let result = await ipcRenderer.invoke('UpdateProfile', id, newProfile)
    return result
}

const runAndSaveProfile = async (locateProfile) => {
    await ipcRenderer.invoke('RunAndSaveProfile', locateProfile)
}

const autoPost = async (locateProfile, base, listPost) => {
    await ipcRenderer.invoke('AutoPost', locateProfile, base, listPost)
}

// Global Value
let listPost = []

let main = document.querySelector('#main')

let buttonProfileTab = document.querySelector('.button-profile')
let buttonSaveImgaeTab = document.querySelector('.button-imgs')
let buttonAuto = document.querySelector('.button-auto')

let viewProfile = document.querySelector('.option')
// Get view Image tag here
let viewAuto = document.querySelector('.auto')

let buttonAddNewProfile = document.querySelector('.button-add-profile')
let buttonExtractSheet = document.querySelector('.button-extract')
let buttonRunAuto = document.querySelector('.button-run-auto')

let tableProfile = document.querySelector('.list-profile table')
let tableExtractSheet = document.querySelector('.table-extract-sheet table')

const inputLinkSheet = document.querySelector('.input-link-sheet')

const createDIV = (className, text='', html='') => {
    let div = document.createElement('div')
    div.className = className
    div.innerText = text
    return div
}
const createForm = (className) => {
    let form = document.createElement('form')
    form.className = className
    return form
}
const createInput = (className, type='text', required=true) => {
    let input = document.createElement('input')
    input.className = className
    input.type = type
    input.required = required

    return input
}
const createSpan = (className, style='', text='') => {
    let span = document.createElement('span')
    span.className = className
    span.style = style
    span.innerText = text
    return span
}
const createSpeLabel = (className, text) => {
    let label = document.createElement('label')
    label.className = 'label'
    for(let i in text) {
        if(text[i] == ' ') {
            let span = createSpan('label-char', '--index: ' + i + '; padding: 3px')
            label.appendChild(span)
            continue
        }
        let span = createSpan('label-char', '--index: ' + i, text[i])
        label.appendChild(span)
    }
    return label    
}
const appendChilds = (parent, childs) => {
    for(let child of childs) {
        parent.appendChild(child)
    }
}
const createButton = (className, text) => {
    let button = document.createElement('button')
    button.className = className
    button.innerText = text
    return button
}
const createTr = (className) => {
    let tr = document.createElement('tr')
    tr.className = className
    return tr
}
let createTd = (className, text, isValue) => {
    let td = document.createElement('td')
    td.className = className
    
    if(isValue) {
        let input = createInput('', require=false)
        input.value = text
        input.readOnly = true

        td.appendChild(input)

    } else {
        td.innerText = text
    }

    return td
}
let createImage = (className, src) => {
    let image = document.createElement('img')
    image.className = className
    image.src = src

    return image
}
let createTh = (className, text) => {
    let th = document.createElement('th')
    th.className = className
    th.innerText = text

    return th
}
let createHeaderTableProfile = () => {
    let tr = createTr('')
    let tdID = createTh('th-1', 'ID')
    let tdName = createTh('th-2', 'Name')
    let tdProxy = createTh('th-3', 'Proxy')
    let tdStorage = createTh('th-4', 'Storage')
    let tdStatus = createTh('th-5', 'Status')
    let tdT = createTh('th-6', '')
    appendChilds(tr, [tdID, tdName, tdProxy, tdStorage, tdStatus, tdT])

    return tr
}
const addFormEditProfile = async (id, profile) => {
    let popup = createDIV('popup-add-new-profile')
    let form = createForm('form-add-new-profile')

    let divTitle = createDIV('title', 'New Profile')

    let divOne = createDIV('wave-group')
    let inputProfileName = createInput('input input-profile-name')
    inputProfileName.value = profile._doc.profilename
    let spanOne = createSpan('bar')
    let labelOne = createSpeLabel('label', 'Profile Name')
    appendChilds(divOne, [inputProfileName, spanOne, labelOne])

    let divTwo = createDIV('wave-group')
    let inputProxy = createInput('input input-profile-name')
    inputProxy.value = profile._doc.proxy
    let spanTwo = createSpan('bar')
    let labelTwo = createSpeLabel('label', 'Proxy')
    appendChilds(divTwo, [inputProxy, spanTwo, labelTwo])

    let divComboButton = createDIV('combo-button')
    let buttonExit = createButton('style-button button-exit', 'Exit')
    let buttonAdd = createButton('style-button button-add', 'Save')
    appendChilds(divComboButton, [buttonExit, buttonAdd])

    appendChilds(form, [divTitle, divOne, divTwo, divComboButton])
    appendChilds(popup, [form])

    buttonAdd.addEventListener('click', async (e) => {
        e.preventDefault()
        let newProfile = {
            profilename: inputProfileName.value,
            proxy: inputProxy.value,
            storage: profile._doc.storage
        }
        await updateProfileByID(id, newProfile)
        await updateTableProfile()
        popup.remove()
    })

    buttonExit.addEventListener('click', async () => {
        popup.remove()
    })

    main.appendChild(popup)
}
let createRowValueProfile = (profile) => {
    let tr = createTr("")
    let tdID = createTd('id td-1', profile._id, true)
    let tdName = createTd('name td-2', profile._doc.profilename, true)
    let tdProxy = createTd('proxy td-3', profile._doc.proxy, true)
    let tdStorage = createTd('storage td-4', profile._doc.storage, true)
    let tdStatus = createTd('status td-5', "", false)
    let buttonRun = createButton('style-button button-running', 'Run')
    buttonRun.addEventListener('click', async () => {
        let getLocate = await getProfileById(profile._id)
        let locateSaveProfile = getLocate._doc.storage 
        await runAndSaveProfile(locateSaveProfile)
    })
    appendChilds(tdStatus, [buttonRun])

    let tdOption = createTd('more td-6', '', false)
    let imgRemove = createImage('', '../icon/icon-trash.svg')
    let imgEdit = createImage('', '../icon/icon-edit.svg')

    imgRemove.addEventListener('click', async () => {
        let confirm = window.confirm('Delete Profile ID: ' + profile._id)
        if(confirm) {
            await deleteProfileByID(profile._id)
            await updateTableProfile()
        } 
    })

    imgEdit.addEventListener('click', async () => {
        await addFormEditProfile(profile._id ,await getProfileById(profile._id))
    })

    appendChilds(tdOption, [imgRemove, imgEdit])

    appendChilds(tr, [tdID, tdName, tdProxy, tdStorage, tdStatus, tdOption])
    return tr
}
const updateTableProfile = async () => {
    let response = await getAllProfile(1, 20)
    tableProfile.innerHTML = ''
    tableProfile.appendChild(createHeaderTableProfile())

    for(let value of response.profiles) {
        let tr = createRowValueProfile(value)
        tableProfile.appendChild(tr)
    }
}

const addFormAddProfile = () => {
    let popup = createDIV('popup-add-new-profile')
    let form = createForm('form-add-new-profile')

    let divTitle = createDIV('title', 'New Profile')

    let divOne = createDIV('wave-group')
    let inputProfileName = createInput('input input-profile-name')
    let spanOne = createSpan('bar')
    let labelOne = createSpeLabel('label', 'Profile Name')
    appendChilds(divOne, [inputProfileName, spanOne, labelOne])

    let divTwo = createDIV('wave-group')
    let inputProxy = createInput('input input-profile-name')
    let spanTwo = createSpan('bar')
    let labelTwo = createSpeLabel('label', 'Proxy')
    appendChilds(divTwo, [inputProxy, spanTwo, labelTwo])

    let divComboButton = createDIV('combo-button')
    let buttonExit = createButton('style-button button-exit', 'Exit')
    let buttonAdd = createButton('style-button button-add', 'add')
    appendChilds(divComboButton, [buttonExit, buttonAdd])

    appendChilds(form, [divTitle, divOne, divTwo, divComboButton])
    appendChilds(popup, [form])

    buttonAdd.addEventListener('click', async (e) => {
        e.preventDefault()
        let profile = {
            profilename: inputProfileName.value,
            proxy: inputProxy.value,
            storage: ""
        }
        await addNewProfile(profile)
        await updateTableProfile()
        popup.remove()
    })

    buttonExit.addEventListener('click', async () => {
        popup.remove()
    })

    return popup
}

buttonAddNewProfile.addEventListener('click', () => {
    main.appendChild(addFormAddProfile())
})

const createRowValueExtractSheet = (values) => {
    let tr = createTr('')

    let tdKeyword = createTd('', values[0], true)
    let tdType = createTd('', values[1], true)
    let tdCategory = createTd('', values[2], true)
    let tdTag = createTd('', values[3], true)
    let tdMeta = createTd('', values[4], true)
    let tdDocs = createTd('', values[5], true)
    let tdLsiKeyword = createTd('', values[6], true)

    appendChilds(tr, [tdKeyword, tdType, tdCategory, tdTag, tdMeta, tdDocs, tdLsiKeyword])
    return tr
}

buttonExtractSheet.addEventListener('click', async () => {
    const linkSheet = inputLinkSheet.value
    const regex = /\/d\/([a-zA-Z0-9-_]+)/
    const idSheet = linkSheet.match(regex)[1]
    const response = await axios.get(`https://docs.google.com/spreadsheets/d/${idSheet}/export?format=csv`)
    const arr = response.data.split('\n')
    arr.splice(0, 1)

    listPost = []

    // 0: KEYWORD || 1:TYPE || 2:CATEGORY || 3:TAG || 4:META || 5: DOCS || 6:LSI KEYWORD
    for(let row of arr) {
        let values = row.split(',')
        listPost.push(values)
        let tr = createRowValueExtractSheet(values)
        tableExtractSheet.appendChild(tr)
    }

    console.log(listPost)
})

buttonRunAuto.addEventListener('click', async () => {
    await autoPost('D:\\Code\\Tool Auto Post Wordpress\\chrome\\profiles\\67ee91c53064b4cb117a6c96', 'https://79king7.net', listPost)
})

// Switch view
buttonProfileTab.addEventListener('click', async () => {
    if(viewProfile.style.display == 'block') return
    viewProfile.style.display = 'block'
    buttonProfileTab.style.setProperty('background-color', '#c3efcd', 'important')

    viewAuto.style.display = 'none'
    buttonAuto.style.backgroundColor = ''

    await updateTableProfile()

    // Offview other
})

buttonAuto.addEventListener('click', async () => {
    if(viewAuto.style.display == 'block') return
    viewAuto.style.display = 'block'
    buttonAuto.style.setProperty('background-color', '#c3efcd', 'important')
    
    viewProfile.style.display = 'none'
    buttonProfileTab.style.backgroundColor = ''

    await updateTableProfile()

    // Offview other
});

(async function() {
    await buttonProfileTab.click()
})()
