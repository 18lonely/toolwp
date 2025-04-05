const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path')
const axios = require('axios')
const fs = require('fs')

const chromeDriverPath = path.resolve(__dirname, './driver/undetected_chromedriver.exe')
const chromeExePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe'; 

const initBrowser = async (profileSave) => {
    const chromeOptions = new chrome.Options()
    chromeOptions.setChromeBinaryPath(chromeExePath)
    // chromeOptions.addArguments('--headless')
    chromeOptions.addArguments(`--user-data-dir=${profileSave}`)
    chromeOptions.addArguments('--disable-notifications')
    chromeOptions.addArguments('--disable-blink-features=AutomationControlled')
    chromeOptions.excludeSwitches(['enable-automation'])
    chromeOptions.addArguments('--no-sandbox')
    chromeOptions.addArguments('--disable-infobars')

    const driver = new Builder()
                        .forBrowser('chrome')
                        .setChromeOptions(chromeOptions)
                        .setChromeService(new chrome.ServiceBuilder(chromeDriverPath))
                        .build()
    await driver.manage().window().maximize()

    return driver
}

const webIsReady = async (driver, timeout = 30000) => {
    await driver.wait(async () => {
        return await driver.executeScript("return document.readyState") === "complete";
    }, timeout);

    // Inject script follow AJAX
    await driver.executeScript(`
        (function() {
            if (window.__ajaxTrackerInstalled) return
            window.__ajaxTrackerInstalled = true

            let openRequests = 0

            // Follow fetch API
            const originalFetch = window.fetch
            window.fetch = function(...args) {
                openRequests++
                return originalFetch.apply(this, args).finally(() => openRequests--);
            };

            // Follow XMLHttpRequest
            const origOpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function() {
                openRequests++
                this.addEventListener('loadend', () => openRequests--);
                origOpen.apply(this, arguments)
            };

            window.isAjaxDone = function() {
                return openRequests === 0
            }
        })()
    `)

    // While all AJAX request complete
    await driver.wait(async () => {
        return await driver.executeScript("return window.isAjaxDone && window.isAjaxDone()");
    }, timeout)
}

const values = {keyword: "Casio Online 3King", 
                type: "Bài viết", 
                category: "Bắn cá",
                tag: 'tag1,tag2',
                meta: 'day la meta test',
                docs: "1TTfd0iSy-_MNSWD875NlEsnnT1Dp9FWFzTjk9z3fdk8",
                lsikeyword: 'NULL'
            }

const URL_NEW_PAGE = 'wp-admin/post-new.php?post_type=page'
const URL_NEW_POST = 'wp-admin/post-new.php'

const MD2HTML = (md) => {
    md = md.replace(/(#{1,4})\s*\*\*(.*?)\*\*/g, (match, hashes, content) => {
        let level = hashes.length
        if(level == 1) {
            return `<h${level} style="text-align: center;"><strong>${content}</strong></h${level}>`
        }
        return `<h${level}><strong>${content}</strong></h${level}>`
    })

    md = md.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

    md = md.split('\n')
    let result = ''
    for(let i = 0; i < md.length; i++) {
        if(md[i] == "" ||!md[i].startsWith("*")) {
            result += '\n' + md[i]
            continue
        }
        result += '<ul>\n'
        while(i < md.length && md[i].startsWith("*")) {
            result += '<li>' + md[i].slice(1, md[i].length) + '</li>\n'
            i = i + 1
        }
        i = i - 1
        result += '</ul>\n'
    }
 
    return result.trim()
}

const extractImgs = (data) => {
    const matches = data.match(/##(.*?)##/g)
    return matches ? matches.map(m => m.slice(2, -2)) : []
}

const extractTitle = (data, isRemoveH1) => {
    let title = data.match(/<h1\b[^>]*>.*?<strong>(.*?)<\/strong>.*?<\/h1>/)?.[1] || ""
    return title
}

const removeH1 = (data) => {
    let result = data.replace(/<h1\b[^>]*>.*?<\/h1>/g, '')
    return result
}

const insertImgsHtmlCodeToPost = (data, attachments) => {
    // Formart: ##..|..##
    attachments = attachments.split('\n')

    let index = 0
    let result = data.replace(/##(.*?)##/g, () => {
        return attachments[index++] || "";
    })
    return result
}

const getIDDocs = (docslink) => {
    const regex = /\/d\/([a-zA-Z0-9_-]+)\//
    const match = docslink.match(regex)

    return match[1]
}

const autoPostToWordPress = async (driver, base, values) => {
    // Direct to main base admin
    await driver.executeScript('window.open("", "_blank");')
    let tabs = await driver.getAllWindowHandles()
    await driver.switchTo().window(tabs[tabs.length - 1])

    await driver.get(base + '/wp-admin')
    await webIsReady(driver)

    // Create a new page
    if(values.type == 'Bài trang') {
        await driver.get(base + URL_NEW_PAGE)
        await webIsReady(driver)
    } else {
        await driver.get(base + URL_NEW_POST)
        await webIsReady(driver)
    }

    // Get post from google sheet
    let {data} = await axios.get(`https://docs.google.com/document/d/${getIDDocs(values.docs)}/export?format=md`)

    data = data.replaceAll('\\', '')
    data = MD2HTML(data)
    let title = extractTitle(data)

    // Set tittle
    let inputTitle = await driver.findElement(By.id("title"))
    await inputTitle.sendKeys(title)
    await webIsReady(driver)

    if(values.type == 'Bài viết') {
        data = removeH1(data)
    }

    // Get code img
    let listImg = extractImgs(data)
    
    let wpContent = await driver.findElement(By.id("content"))
    // Tải ảnh lên server, tải html về
    for await(let text of listImg) {
        let arr = text.split('|')

        let contentHtmlButton = await driver.findElement(By.id('content-html'))
        await contentHtmlButton.click()

        let insertMediaButton = await driver.findElement(By.id('insert-media-button'))
        await insertMediaButton.click()
        await driver.sleep(1000)

        let menuItemUploadButton = await driver.findElement(By.id('menu-item-upload'))
        await menuItemUploadButton.click()
        await driver.sleep(1000)
        let inputUploadFile = await driver.findElement(By.xpath('//input[@accept="image/jpeg,.jpg,.jpeg,.jpe,image/gif,.gif,image/png,.png,image/bmp,.bmp,image/tiff,.tiff,.tif,.webp,.avif,.ico,.heic,.heif,.heics,.heifs,.asf,.asx,video/x-ms-wmv,.wmv,.wmx,.wm,video/avi,.avi,.divx,video/x-flv,.flv,video/quicktime,.mov,.qt,video/mpeg,.mpeg,.mpg,.mpe,video/mp4,.mp4,video/x-m4v,.m4v,video/ogg,.ogv,video/webm,.webm,video/x-matroska,.mkv,video/3gpp,.3gp,.3gpp,video/3gpp2,.3g2,.3gp2,text/plain,.txt,.asc,.c,.cc,.h,.srt,text/csv,.csv,.tsv,.ics,.rtx,text/css,.css,text/html,.htm,.html,.vtt,.dfxp,audio/mpeg,.mp3,audio/x-m4a,.m4a,.m4b,audio/aac,.aac,.ra,.ram,audio/x-wav,.wav,audio/ogg,.ogg,.oga,audio/flac,.flac,.mid,.midi,audio/x-ms-wma,.wma,.wax,.mka,text/rtf,.rtf,application/x-javascript,.js,application/pdf,.pdf,.class,.tar,application/zip,.zip,.gz,.gzip,.rar,.7z,image/photoshop,.psd,.xcf,application/msword,.doc,application/vnd.ms-powerpoint,.pot,.pps,.ppt,.wri,.xla,application/vnd.ms-excel,.xls,.xlt,.xlw,.mdb,.mpp,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,.docm,application/vnd.openxmlformats-officedocument.wordprocessingml.template,.dotx,.dotm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx,.xlsm,.xlsb,.xltx,.xltm,.xlam,application/vnd.openxmlformats-officedocument.presentationml.presentation,.pptx,.pptm,application/vnd.openxmlformats-officedocument.presentationml.slideshow,.ppsx,.ppsm,application/vnd.openxmlformats-officedocument.presentationml.template,.potx,.potm,.ppam,.sldx,.sldm,.onetoc,.onetoc2,.onetmp,.onepkg,.oxps,.xps,.odt,.odp,.ods,.odg,.odc,.odb,.odf,.wp,.wpd,.key,.numbers,.pages,application/json,.json,image/svg+xml,.svg,.ttf,application/vnd.oasis.opendocument.formula-template,.otf"]'))

        let pathImag = path.resolve(__dirname, "../img/" + arr[0])
        inputUploadFile.sendKeys(pathImag)
        await webIsReady(driver)
        // Thêm một số thông tin về ảnh tại đây
        // Văn bản thay thế
        let attachmentDetailsAltText = await driver.findElement(By.id("attachment-details-alt-text"))
        await attachmentDetailsAltText.clear()
        await attachmentDetailsAltText.sendKeys(arr[1])
        
        await driver.sleep(1000)
        let attachmentDetailsTitle = await driver.findElement(By.id("attachment-details-title"))
        await attachmentDetailsTitle.clear()
        await attachmentDetailsTitle.sendKeys(arr[2])
        await driver.sleep(1000)
        let attachmentDetailsCaption = await driver.findElement(By.id("attachment-details-caption"))
        await attachmentDetailsCaption.clear()
        await attachmentDetailsCaption.sendKeys(arr[3])
        await driver.sleep(1000)
        let attachmentDetailsDescription = await driver.findElement(By.id("attachment-details-description"))
        await attachmentDetailsDescription.clear()
        await attachmentDetailsDescription.sendKeys(arr[4])
        await driver.sleep(1000)

        let buttonMediaInsert = await driver.findElement(By.className('media-button-insert'))
        await buttonMediaInsert.click()
        await webIsReady(driver)

        await wpContent.sendKeys('\n')
    }

    let attachments = await wpContent.getAttribute('value')
    let html = insertImgsHtmlCodeToPost(data, attachments)
    
    // Set keyword
    let inputKeyword = await driver.findElement(By.className('tagify__input'))
    await inputKeyword.sendKeys(values.keyword)

    // Set url
    await driver.executeScript('document.querySelector(".edit-slug").click()')
    let inputUrl = await driver.findElement(By.id("new-post-slug"))
    await inputUrl.clear()
    await inputUrl.sendKeys(values.keyword)
    let btnSubmitChangeUrl = await driver.findElement(By.xpath('//*[@id="edit-slug-buttons"]/button[1]'))
    await btnSubmitChangeUrl.click()

    // Kiểm tra nếu là bài viết thì sẽ tích thêm danh mục
    if(values.type == 'Bài viết') {
        let listCategory = await driver.findElements(By.className("rank-math-primary-term-li"))

        for await(let category of listCategory) {
            let textCategory = await category.getAttribute('innerText')
            if(textCategory.indexOf(values.category) != -1) {
                let id = await category.getAttribute('id')
                let checkbox = await driver.findElement(By.id(id.slice(0, id.length - 1) + '2'))
                await checkbox.click()
            }
        }
    }

    // Thêm tag
    if(values.type == 'Bài viết') {
        let inputTag = await driver.findElement(By.id('new-tag-post_tag'))
        await inputTag.clear()
        await inputTag.sendKeys(values.tag)
        let buttonTagAdd = await driver.findElement(By.className('tagadd'))
        await buttonTagAdd.click()
        await webIsReady(driver)
    }

    // Add meta here
    let buttonEditMeta = await driver.findElement(By.className('rank-math-edit-snippet'))
    await buttonEditMeta.click()
    let inputMeta = await driver.findElement(By.id('rank-math-editor-description'))
    await inputMeta.clear()
    await inputMeta.sendKeys(values.meta)
    let buttonCloseSaveMeta = await driver.findElement(By.className('components-button is-small has-icon'))
    await buttonCloseSaveMeta.click()
    await webIsReady(driver)

    // Insert Post
    await wpContent.clear()
    await wpContent.sendKeys(html)

    // Click add post
    await driver.executeScript('document.querySelector("#publish").click()')
    await driver.sleep(30000)
}

const runAndSaveProfile = async (locateProfile) => {
    try {
        const driver = await initBrowser(locateProfile)
    } catch(err) {
        throw new Error('Windown was closed!')
    }
}

const auto = async (locateProfile, base, listPost) => {
    const driver = await initBrowser(locateProfile)
    
    for await (let v of listPost) {
        let values = {keyword: v[0], 
            type: v[1], 
            category: v[2],
            tag: v[3].replaceAll('|', ','),
            meta: v[4],
            docs: v[5],
            lsikeyword: v[6]
        }
        await autoPostToWordPress(driver, base, values)
    }
    
}

(async function() {
    // const driver = await initBrowser('D:\\Code\\Tool Auto Post Wordpress\\chrome\\profiles\\67ee91c53064b4cb117a6c96')
    // await autoPostToWordPress(driver, 'https://79king7.net', values)
})()

module.exports = {runAndSaveProfile, auto}

