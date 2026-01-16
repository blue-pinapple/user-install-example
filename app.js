import 'dotenv/config';
import express from 'express';
import { InteractionType, InteractionResponseType } from 'discord-interactions';
import {
  VerifyDiscordRequest,
  getServerLeaderboard,
  createPlayerEmbed,
  getRandomLine,
} from './utils.js';
import { getFakeProfile, getWikiItem } from './game.js';
import { getRandomGif, getRandomGif2 } from './gif.js';
import { Level } from 'level';
const db = new Level('example', { valueEncoding: 'json' })

// Add an entry with key 'a' and value 1


// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post('/interactions', async function (req, res) {
  // Interaction type and data
  const { type, data, user } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  // Log request bodies
  //console.log(req.body);

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name, options, resolved } = data;
    // "leaderboard" command
    if (name === 'leaderboard') {
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: await getServerLeaderboard(req.body.guild.id),
          allowed_mentions: {
            parse: [],
          },
        },
      });
    }
    // "profile" command
    if (name === 'profile') {
      const profile = getFakeProfile(0);
      const profileEmbed = createPlayerEmbed(profile);

      // Use interaction context that the interaction was triggered from
      const interactionContext = req.body.context;
      
      // Construct `data` for our interaction response. The profile embed will be included regardless of interaction context
      let profilePayloadData = {
        embeds: [profileEmbed],
      };

      // If profile isn't run in a DM with the app, we'll make the response ephemeral and add a share button
      if (interactionContext !== 1) {
        // Make message ephemeral
        profilePayloadData['flags'] = 64;
        // Add button to components
        profilePayloadData['components'] = [
          {
            type: 1,
            components: [
              {
                type: 2,
                label: 'Share Profile',
                custom_id: 'share_profile',
                style: 2,
              },
            ],
          },
        ];
      }

      // Send response
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: profilePayloadData,
      });
    }
    // "link" command
    if (name === 'link') {
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content:
            'Authorize your Quests of Wumpus account with your Discord profile.',
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  label: 'Link Account',
                  style: 5,
                  // If you were building this functionality, you could guide the user through authorizing via your game/site
                  url: 'https://discord.com/developers/docs/intro',
                },
              ],
            },
          ],
        },
      });
    }
    // "edit" command
    if (name === 'card') {
      let id = resolved.attachments[options[1].value].id
          console.log(resolved.attachments);
      await db.put(id, resolved.attachments[options[1].value].url)
      // Send initial message with a button that can edit it when pressed
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: resolved.attachments[options[0].value].url,
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  label: 'Open Card',
                  custom_id: 'edit_me',
                  style: 1,
                },
                {
                  type: 2,
                  style:2,
                  label: 'Data',
                  custom_id: id,
                  disabled: true,
                }
              ],
            },
          ],
        },
      });
    }
    
    // "explode" command
    if (name === 'explode') {
      let gifURL = await getRandomGif2("Explosion")
      let text = "bomb"

      // Send initial message with a button that can edit it when pressed
      if (options?.length > 0) {
        text = await getRandomLine("explode_lines_users.txt");
        const target = resolved.users[options[0].value];
        text = text.replace("{target}", "<@"+target.id+">")
        //console.log(user);
        try {
          text = text.replace("{user}", "<@"+user.id+">")
        } catch (e) {
          text = text.replace("{user}", "Someone")
          console.log("failed to find user \n", e);
        }
      } else {
        text = await getRandomLine("explode_lines.txt");
      }
      //bolds text
      text = `**${text}**`;
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          "flags": 32768,
          "components": [
            {
              "type": 12,
              "items": [
                {
                  "media": {
                    "url": gifURL,
                  },
                  "description": null,
                  "spoiler": false
                }
              ]
            },
            {
              "type": 14,
              "divider": false,
              "spacing": 1
            },
            {
              "type": 10,
              "content": text
            }
          ]
        },
      });
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: gifURL,
        },
      });
    }

    // "wiki" command
    if (name === 'wiki') {
      const option = data.options[0];
      const selectedItem = getWikiItem(option.value);
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `${selectedItem.emoji} **${selectedItem.name}**: ${selectedItem.description}`,
        },
      });
    }
  }

  // handle button interaction
  if (type === InteractionType.MESSAGE_COMPONENT) {
    const { custom_id } = req.body.data;

    // If the edit button was pressed, update the original message
    if (custom_id === 'edit_me') {
      const value = await db.get(req.body.message.components[0].components[1].custom_id)
      return res.send({
        type: InteractionResponseType.UPDATE_MESSAGE,
        data: {
          content: value,
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  label: 'Merry Christmas',
                  custom_id: 'edit_me',
                  style: 2,
                  disabled: true,
                },
              ],
            },
          ],
        },
      });
    }

    // fallback for other components (e.g., profile share)
    const profile = getFakeProfile(0);
    const profileEmbed = createPlayerEmbed(profile);
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [profileEmbed],
      },
    });
  }
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
