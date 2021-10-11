import fetch from 'isomorphic-unfetch'

import { initBot, transcript, reaction } from '../utils'

const generateLink = file => {
  console.log('generating link for file', file.id)
  return new Promise((resolve, reject) => {
    initBot(true).api.files.sharedPublicURL({ file: file.id }, (err, res) => {
      if (err) {
        if (err == 'already_public') {
          resolve(file.permalink_public)
        }
        console.error(err)
        reject(err)
      }
      if (res?.file?.permalink_public) {
        resolve(res?.file?.permalink_public)
      } else {
        reject(new Error('Slack could not generate public link'))
      }
    })
  })
}

const uploadToCDN = async files => {
  console.log('Generating links for ', files.length, 'file(s)')
  console.log(Object.keys(files[0]))

  const fileURLs = await Promise.all(
    files.map(async file => {
      const pageURL = await generateLink(file)
      console.log('public page url', pageURL)
      const urlRegex = /([A-Za-z0-9]+)/g
      const urlChunks = pageURL
        .replace('https://slack-files.com/', '')
        .match(urlRegex)
      const [teamID, fileID, pubSecret] = urlChunks
      console.log('url chunks', urlChunks)
      const fileURL = `${file.url_private}?pub_secret=${pubSecret}`
      return fileURL
    })
  )

  return new Promise((resolve, reject) => {
    fetch('https://cdn.hackclub.com/api/new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fileURLs),
    })
      .then(r => r.json())
      .then(resolve)
      .catch(reject)
  })
}

export default async (bot = initBot(), message) => {
  const cdnChannelID = 'C016DEDUL87'

  const { ts, channel, files } = message
  if (channel != cdnChannelID) {
    return
  }

  const extFlavorOptions = files.map(file => {
    try {
      return transcript(`fileShare.extensions.${file.filetype}`)
    } catch (e) {
      return null
    }
  })
  const extFlavor = extFlavorOptions[Math.floor(Math.random() * extFlavorOptions.length)]

  if (extFlavor) {
    bot.replyInThread(message, { text: extFlavor })
  }

  try {
    const results = {}
    await Promise.all([
      reaction(bot, 'add', channel, ts, 'beachball'),
      uploadToCDN(files)
        .then(f => {
          results.links = f
        })
        .catch(e => {
          results.error = e
        }),
    ])
    if (results.error) {
      throw results.error
    }

    if (results.links) {
      await Promise.all([
        reaction(bot, 'remove', channel, ts, 'beachball'),
        reaction(bot, 'add', channel, ts, 'white_check_mark'),
        bot.replyInThread(message, {
          text: transcript('fileShare.success', { links: results.links, user: message.user }),
          unfurl_media: false,
          unfurl_links: false,
        }),
      ])
    }
  } catch (err) {
    if (Math.random() > 0.5) {
      await bot.replyInThread(message, transcript('fileShare.error'))
    }

    await Promise.all([
      reaction(bot, 'remove', channel, ts, 'beachball'),
      reaction(bot, 'add', channel, ts, 'no_entry'),
      bot.replyInThread(message, transcript('errors.general', { err })),
    ])
  }
}
