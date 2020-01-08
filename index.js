const fs = require('fs')
const TelegramBot = require('node-telegram-bot-api')
const gm = require('gm').subClass({ imageMagick: true })

const BotToken = fs.readFileSync('./bottoken.txt').toString().trim()
const bot = new TelegramBot(BotToken, { polling: true })

const $TEXT_Help = `Hello, Blabla Test 1234  W.I.P`

bot.onText(/\/start|\/help/, async (msg) => {
    const chatId = msg.chat.id
    await bot.sendMessage(chatId, $TEXT_Help)
})

Number.prototype.pad = function(size) {
    var s = String(this);
    while (s.length < (size || 2)) {s = "0" + s;}
    return s;
}

const doJob = async (chatId, fileId, fileInfo) => {
    try {
        let imInput = await bot.downloadFile(fileId, 'cache/')
        console.log(fileInfo)
        imInput = await fs.readFileSync(imInput)
        let W = 2048 + 512, H = 2048 + 512
        // if (fileInfo.height > fileInfo.width)
        let tileFiles = await new Promise((res, rej) => {
            gm(imInput)
            .out('-resize', `${ W }x${ H }!`)
            .out('-crop', '512x512')
            .write(`tiles/${ fileId }#%03d.png`, (err, result) => {
                if (err) return rej(err)
                let files = []
                for (let i = 0; i <= 24; i++) {
                    files.push(`tiles/${ fileId }#${ i.pad(3) }.png`)
                }
                return res(files);
            });
        });
        const packName = `T${ new Date().valueOf() }_by_SplitterStickerBot`,
            packTitle = `T${ new Date().valueOf() } @SplitterStickerBot`
        const stickerPack = await bot.createNewStickerSet(chatId, packName, packTitle, fs.readFileSync(tileFiles.shift()), '🖼')
        console.log('uploading files', stickerPack);
        for (let tileFile of tileFiles) {
            await bot.addStickerToSet(chatId, packName, fs.readFileSync(tileFile), '🖼')
            fs.unlinkSync(tileFile)
        }

        console.log(stickerPack)
        bot.sendMessage(chatId, `https://t.me/addstickers/${ packName }`)

    } catch (err) {
        console.error(err)
    }
}
bot.on('message', async (msg) => {
    const chatId = msg.from.id
    if (chatId !== 39957353) return bot.sendMessage(chatId, 'Alpha test only @cuddlycheetah')
    if (!!msg.photo) {
        const fileInfo = msg.photo[ msg.photo.length - 1 ]
        console.log(chatId, fileInfo)
        await bot.sendMessage(msg.chat.id, `Bild: ${ fileInfo.file_id } wird verarbeitet...`)
        doJob(chatId, fileInfo.file_id, fileInfo)
    }
})

