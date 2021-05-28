/* 

  Clippy bot for mastodon.

  (c) Hugh Rundle, licensed AGPL 3.0 or later
  Contact @hugh@ausglam.space

  NOTE: Since requesting users must be followed by the bot, they will "out" themselves by using it.
  This does not appear to be fixable with the API, so bot owners should manually "Hide network".
*/

// require modules
const axios = require('axios')
const crypto = require('crypto') // built-in node module requires v12.19 or higher
const WebSocket = require('ws')

// clippy settings

const access_token = process.env.CLIPPY_ACCESS_TOKEN
const topic = process.env.CLIPPY_TOPIC.toLowerCase()
const clippy = process.env.CLIPPY_USER
const domain = process.env.CLIPPY_DOMAIN

// set authorization headers for all API calls
const headers = {
  'Authorization' : `Bearer ${access_token}`
}

// set up bot account with correct settings
function initiateSettings() {

    let account = {
      locked: false,
      bot: true,
      discoverable: true,
      source: { privacy: 'private' }
    }

    // update with the above settings
    return axios.patch(`https://${domain}/api/v1/accounts/update_credentials`, account, { headers: headers })
    .catch( err => {
      console.error('ERROR applying bot user settings: ', err.message)
    })
}

// return random suggestion string
function suggestion() {

  const n = crypto.randomInt(6)

    switch(n) {
      case 0:
        return 'How about logging off instead?';
      case 1:
        return 'Would you like to delete your toot?';
      case 2:
        return 'Can I help you take a walk outside?';
      case 3:
        return 'You may like to reconsider your life choices.';
      case 4:
        return 'Why not try looking at #CatsOfInstagram instead?';
      case 5:
        return `You're better than this, come on.`;
    }
}

// send a message when someone toots about the topic
function sendResponse(rip, user) {

  let payload = {
    'status' : `@${user} It looks like you're posting about '${topic}'. ${suggestion()}`,
    'spoiler_text' : topic,
    'in_reply_to_id' : rip,
  }

  axios.post(`https://${domain}/api/v1/statuses`, payload, { headers: headers })
  .catch( err => {
    console.error(err.message)
  })

}

// follow users who subscribe
function followAction(id, action) {

  let url = `https://${domain}/api/v1/accounts/${id}/${action}`

  let payload = {
    reblogs: false,
    notify: false
  }

  axios.post(url, payload, { headers: headers })
  .catch( err => {
    console.error(err.message)
  })

}

function filterMentions(text, mentions) {
  // filter toot text to remove mentions before checking for the trigger word
  // this means if your trigger word is in a user name, you don't get a tsunami of clippy advice
  let rawArray = text.replace(/(<([^>]+)>)/gi, "").split(' ')
  return rawArray.map( stub => mentions.some( name => `@${name}` === stub) ? "" : stub).toString()
}

// ***********************
//  STREAMING USER TIMELINE
//  This is where the action is!
// ***********************
const ws = new WebSocket(`wss://${domain}/api/v1/streaming?access_token=${access_token}&stream=user`)

// make sure bot is set up correctly each time it starts
initiateSettings() 

// errors
ws.on('error', err => {
  console.error(`WebSocket error: ${err.message}`)
})

// check updates and notifications in the stream
ws.on('message', msg => {
  let packet = JSON.parse(msg)
  let data = JSON.parse(packet.payload)

  // notifications
  if (packet.event == 'notification') {

    // always follow back
    if (data.type == 'follow') {
      followAction(data.account.id, 'follow')
    }

    if (data.type == 'mention') {

      let post = data.status.content

      // check start requests
      if (post.match(/\bSTART\b/)) {
        followAction(data.account.id, 'follow')
      }

      // check stop requests
      if (post.match(/\STOP\b/)) {
        followAction(data.account.id, 'unfollow')
      }
    }
  }

  // updates (posts)
  if (packet.event == 'update') {
    let rip = data.id
    let user = data.account.acct
    // get just the account names (@name@domain.tld)
    let mentions = data.mentions.map( mention => mention.acct)
    // exclude own toots and @mentions to avoid an infinite loops
    if (data.account.username !== clippy && !mentions.includes(clippy)) {
      // get rid of mentions in case topic is within a username
      let text = filterMentions(data.content, mentions)
      if ( text.toLowerCase().includes(topic) ) {
        sendResponse(rip, user)
      }
      else if (data.spoiler_text.toLowerCase().includes(topic)) {
          sendResponse(rip, user)
      } 
      else if (data.tags.map(tag => tag.name.toLowerCase()).includes(topic)) {
        sendResponse(rip, user)
      }
    }
  }
})

