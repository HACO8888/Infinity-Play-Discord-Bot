const {
  Events,
  MessageFlags,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
} = require("discord.js");

const MODERATION_ACTIONS = {
  kick: {
    permission: PermissionFlagsBits.KickMembers,
    noPermission: "您沒有踢出成員的權限!",
    reason: "因傳送非本群邀請連結被踢出伺服器",
    done: (tag) => `已將 ${tag} 踢出伺服器`,
  },
  ban: {
    permission: PermissionFlagsBits.BanMembers,
    noPermission: "您沒有封鎖成員的權限!",
    reason: "因傳送非本群邀請連結被永久禁止進入伺服器",
    done: (tag) => `已將 ${tag} 禁止進入伺服器`,
  },
};

// 處理完後把原本通報訊息上的按鈕停用，避免重複操作
function disableButtons(message) {
  const rows = message.components.map((row) =>
    new ActionRowBuilder().addComponents(
      row.components.map((component) => ButtonBuilder.from(component).setDisabled(true)),
    ),
  );
  return message.edit({ components: rows });
}

async function handleModerationButton(interaction, actionName, userId) {
  const action = MODERATION_ACTIONS[actionName];

  if (!interaction.memberPermissions?.has(action.permission)) {
    await interaction.reply({ content: action.noPermission, flags: MessageFlags.Ephemeral });
    return;
  }

  // 用 REST 抓單一成員，不需要 Guild Members intent；成員已離開時會是 null
  const member = await interaction.guild.members.fetch(userId).catch(() => null);

  if (actionName === "kick") {
    if (!member) {
      await interaction.reply({ content: "找不到該用戶，可能已經離開伺服器", flags: MessageFlags.Ephemeral });
      return;
    }
    if (!member.kickable) {
      await interaction.reply({ content: "機器人無法踢出該用戶（身分組可能比機器人高）", flags: MessageFlags.Ephemeral });
      return;
    }
    await member.kick(action.reason);
    await interaction.reply({ content: action.done(member.user.tag) });
  }
  else {
    if (member && !member.bannable) {
      await interaction.reply({ content: "機器人無法封鎖該用戶（身分組可能比機器人高）", flags: MessageFlags.Ephemeral });
      return;
    }
    // 成員已離開也能用 ID 封鎖
    await interaction.guild.members.ban(userId, { reason: action.reason });
    await interaction.reply({ content: action.done(member?.user.tag ?? `<@${userId}>`) });
  }

  await disableButtons(interaction.message).catch(() => null);
}

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // 處理 Slash Commands
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        console.error(
          `No command matching ${interaction.commandName} was found.`,
        );
        return;
      }

      try {
        await command.execute(interaction);
      }
      catch (error) {
        console.error(`Error executing ${interaction.commandName}`);
        console.error(error);
      }
      return;
    }

    // 處理 Button 點擊
    if (interaction.isButton() && interaction.inGuild()) {
      const [actionName, userId] = interaction.customId.split("-");
      if (!Object.hasOwn(MODERATION_ACTIONS, actionName) || !userId) return;

      try {
        await handleModerationButton(interaction, actionName, userId);
      }
      catch (error) {
        console.error(`Error handling button ${interaction.customId}:`);
        console.error(error);

        // 如果還沒有回應過，就發送錯誤訊息
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: "處理按鈕時發生錯誤",
            flags: MessageFlags.Ephemeral,
          });
        }
      }
    }
  },
};
