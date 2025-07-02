const { Events } = require("discord.js");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // 處理 Slash Commands
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        console.error(
          `No command matching ${interaction.commandName} was found.`
        );
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`Error executing ${interaction.commandName}`);
        console.error(error);
      }
      return;
    }

    // 處理 Button 點擊
    if (interaction.isButton()) {
      const buttonId = interaction.customId;

      try {
        if (buttonId.startsWith('kick-') || buttonId.startsWith('ban-')) {
          // 這裡可以處理 kick 和 ban 按鈕的邏輯
          const userId = buttonId.split('-')[1];
          const user = interaction.guild.members.cache.get(userId);
          // 確認使用者有沒有剔除或禁止的權限
          if (!interaction.member.permissions.has('KickMembers') && !interaction.member.permissions.has('BanMembers')) {
            await interaction.reply({
              content: '您沒有權限執行踢人或禁止人的操作!',
              ephemeral: true
            });
            return;
          }
          if (!user) {
            await interaction.reply({
              content: '找不到該用戶',
              ephemeral: true
            });
            return;
          }
          if (buttonId.startsWith('kick-')) {
            await user.kick('因傳送非本群邀請連結被踢出伺服器');
            await interaction.reply({
              content: `已將 ${user.user.tag} 踢出伺服器`,
              ephemeral: false
            });
          } else if (buttonId.startsWith('ban-')) {
            await user.ban({ reason: '因傳送非本群邀請連結被永久禁止進入伺服器' });
            await interaction.reply({
              content: `已將 ${user.user.tag} 禁止進入伺服器`,
              ephemeral: false
            });
          }
          return;
        }
      } catch (error) {
        console.error(`Error handling button ${buttonId}:`);
        console.error(error);

        // 如果還沒有回應過，就發送錯誤訊息
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: '處理按鈕時發生錯誤',
            ephemeral: true
          });
        }
      }
      return;
    }
  },
};