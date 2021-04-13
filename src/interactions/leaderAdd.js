import { getInfoForUser, airPatch, transcript, airFind } from '../utils'

const interactionLeaderAdd = async (bot, message) => {
  const { user, text, channel } = message

  const taggedUserID = (text.match(/\<@(.*)\|/) || [])[1]
  if (!taggedUserID) {
    bot.replyPrivateDelayed(message, transcript('leaderAdd.help'))
    return
  }

  const taggedUser = await getInfoForUser(taggedUserID)
  const commandUser = await getInfoForUser(user)
  const recipientClub = await airFind('Clubs', 'Slack Channel ID', channel)

  if (!commandUser.club && !commandUser.permissionedAmbassador) {
    throw transcript('leaderAdd.invalidClub')
  }

  if (!recipientClub) {
    throw transcript('leaderAdd.clubNotFound')
  }

  if (commandUser.club && commandUser.club.id != recipientClub.id) {
    // A leader is trying to permission someone to a channel that's not their
    // club channel
    throw transcript('leaderAdd.invalidChannel')
  }

  const taggedUserClubs = taggedUser.person.fields['Clubs'] || []
  if (taggedUserClubs.includes(recipientClub)) {
    throw transcript('leaderAdd.alreadyLeader')
  }

  await airPatch('People', taggedUser.person.id, {
    Clubs: [...taggedUserClubs, recipientClub.id],
  })

  // invite leader to #leaders and their club channel
  bot.api.conversations.invite({
    token: bot.config.bot.access_token,
    channel,
    users: taggedUserID
  })
  bot.api.conversations.invite({
    token: bot.config.bot.access_token,
    channel: 'GAE0FFNFN',
    users: taggedUserID
  })

  bot.replyPrivateDelayed(
    message,
    transcript('leaderAdd.success', { taggedUserID, channel })
  )
}

export default interactionLeaderAdd
