// import {
//   initBot,
//   getInfoForUser,
//   airFind,
//   airCreate,
//   transcript,
// } from '../../utils'
// import interactionMailMission from '../mailMission'

// /*
// to test
// [ ] mailteam request vanilla grant
// [ ] mailteam request recurring grant (valid)
// [ ] mailteam request recurring grant (already had grant this semester)
// [ ] hcb request vanilla grant
// [ ] hcb request recurring grant (valid)
// [ ] hcb request recurring grant (already had grant this semester)
// [ ] request from non leader
// */
// export const names = ['GitHub Grant', 'club grant']
// export const details =
//   'Available to club leaders. Must have a meeting time set with `/meeting-time`'

// export async function run(bot, message) {
//   const { user } = message
//   const { leader, club, history, personAddress } = await getInfoForUser(user)

//   if (!leader || !club) {
//     await bot.replyPrivateDelayed(
//       message,
//       transcript('promos.githubGrant.notAuthorized')
//     )
//     return
//   }

//   await bot.replyPrivateDelayed(
//     message,
//     transcript('promos.githubGrant.programClosed')
//   )
//   return // we're closing down grants this semester until we get more funding from GitHub

//   const lastGrant = await airFind(
//     'GitHub Grants',
//     `AND({Dummy} = 0, {Club} = '${club.fields['ID']}')`,
//     null,
//     {
//       selectBy: {
//         sort: [{ field: 'Initiated at', direction: 'desc' }],
//       },
//     }
//   )
//   if (!lastGrant) {
//     // this is their first grant
//     const grant = await airCreate('GitHub Grants', {
//       Club: [club.id],
//       Leader: [leader.id],
//       Type: 'First meeting ($100)',
//       'Grant amount': 100,
//     })

//     if (grant.fields['HCB Account']) {
//       // if they have an HCB account, we'll notify the bank team
//       await bot.replyPrivateDelayed(
//         message,
//         transcript('promos.githubGrant.hcbFulfillment', {
//           hcbLink: grant.fields['HCB Account'],
//         })
//       )
//     } else if (
//       personAddress.fields['Country'] === 'United States of America (US)'
//     ) {
//       // if no HCB account, check if they're in the US. If so, setup a mail mission
//       await interactionMailMission(undefined, {
//         user,
//         text: 'new_club_grant',
//       })
//       await bot.replyPrivateDelayed(
//         message,
//         transcript('promos.githubGrant.usShipping')
//       )
//     } else {
//       // if no HCB account
//       await bot.replyPrivateDelayed(
//         message,
//         transcript('promos.githubGrant.otherSuccess')
//       )
//     }
//     return
//   } else {
//     // they've had a grant before
//     const lastGrantDate = new Date(lastGrant.fields['Initiated at'])
//     const today = new Date()

//     // our heuristic for keeping 1 grant per semester is to check if the last grant was both this semester & this year
//     // semesters are defined as:
//     // - first semester months are 6 through 11
//     // - second semester months are 0 through 5
//     const currentSemester = Math.floor(today.getMonth() / 5)
//     const lastGrantSemester = Math.floor(lastGrantDate.getMonth() / 5)

//     const hasSameYear = lastGrantDate.getYear() == today.getYear()
//     const hasSameSemester = lastGrantSemester == currentSemester
//     if (hasSameYear && hasSameSemester) {
//       const requester = (
//         await airFind(
//           'People',
//           `RECORD_ID() = '${lastGrant.fields['Leader'][0]}'`
//         )
//       ).fields['Slack ID']
//       await bot.replyPrivateDelayed(
//         message,
//         transcript('promos.githubGrant.alreadyGranted', {
//           lastGrantDate,
//           requester,
//         })
//       )
//       return
//     }

//     if (!history.isActive) {
//       await bot.replyPrivateDelayed(
//         message,
//         transcript('promos.githubGrant.inactive')
//       )
//     }

//     const grant = await airCreate('GitHub Grants', {
//       Club: [club.id],
//       Leader: [leader.id],
//       Type: 'Semesterly ($50)',
//       'Grant amount': 50,
//     })

//     bot.replyPrivateDelayed(
//       message,
//       transcript('promos.githubGrant.requestForm', { id: grant.id })
//     )
//   }
// }
