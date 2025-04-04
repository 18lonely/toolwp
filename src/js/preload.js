const fs = require('fs')
const path = require('path')


/**
 * ID|Profile Name|Proxy|Status
 * ID|Profile Name|Proxy|Status
 * ID|Profile Name|Proxy|Status
 */

const writeDB = (profiles) => {
    let text = ''
    for(let profile of profiles) {
        text += profile.id + '|' + profile.name + '|' + profile.proxy + '|' + profile.status + '\n'
    }

    fs.writeFileSync('db.text', text.trim(), 'utf-8')
}

const getAllProfiles = () => {
    const datas = fs.readFileSync('db.text', 'utf-8').split('\n')

    const profiles = []

    for(let data of datas) {
        let arr = data.split('|')
        profiles.push({id: arr[0], name: arr[1], proxy: arr[2], status: arr[3]})
    }

    return profiles
}

const getProfileByID = (id) => {
    let profiles = getAllProfiles()

    for(let profile of profiles) {
        if(profile.id == id) {
            return profile
        }
    }

    return null
}

const randomID = () => {
    return (Date.now()).toString() + (Math.random() * 99999 + 10000)
}

const addProfile = (profile) => {
    let profiles = getAllProfiles()
    profiles.push(profile)
    writeDB(profiles)
}

const updateProfileByID = (id, newProfile) => {
    let profiles = getAllProfiles()

    for(let i in profiles) {
        if(profiles[i].id == id) {
            profiles[i] = newProfile
            writeDB(profiles)
            return true
        }
    }

    return null
}

const indexOfProfile = (id) => {
    let profiles = getAllProfiles()
    for(let i in profiles) {
        if(profiles[i].id == id)
            return i
    }
    return -1
}

const deleteProfileByID = (id) => {
    let index = indexOfProfile(id)
    if(index == -1) return null
    let profiles = getAllProfiles()
    profiles.splice(index, 1)
    writeDB(profiles)
    return true
}