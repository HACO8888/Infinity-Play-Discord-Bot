const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('refresh')
        .setDescription('重新載入指令或事件')
        .addStringOption(option =>
            option
                .setName('type')
                .setDescription('選擇要重新載入的類型')
                .setRequired(true)
                .addChoices(
                    { name: '指令 (Commands)', value: 'commands' },
                    { name: '事件 (Events)', value: 'events' },
                    { name: '全部 (All)', value: 'all' }
                )
        ),

    async execute(interaction) {
        // 檢查權限
        if (interaction.member.user.id !== "508964901415550976") {
            return await interaction.reply({
                content: '❌ 你沒有權限使用此指令！',
                ephemeral: true
            });
        }

        const { client } = interaction;
        const type = interaction.options.getString('type');

        try {
            let refreshedCount = 0;
            let errorCount = 0;
            let results = [];

            // 立即回覆，避免超時
            await interaction.reply({
                content: '🔄 正在重新載入，請稍候...',
                ephemeral: true
            });

            if (type === 'commands' || type === 'all') {
                const commandResult = await refreshCommands(client);
                refreshedCount += commandResult.success;
                errorCount += commandResult.errors;
                results.push(`📝 指令: ${commandResult.success} 個成功，${commandResult.errors} 個失敗`);
            }

            if (type === 'events' || type === 'all') {
                const eventResult = await refreshEvents(client);
                refreshedCount += eventResult.success;
                errorCount += eventResult.errors;
                results.push(`⚡ 事件: ${eventResult.success} 個成功，${eventResult.errors} 個失敗`);
            }

            const embed = new EmbedBuilder()
                .setTitle('🔄 重新載入完成')
                .setColor(errorCount > 0 ? 0xFF6B6B : 0x00FF00)
                .setDescription(results.join('\n'))
                .addFields(
                    { name: '✅ 成功', value: `${refreshedCount}`, inline: true },
                    { name: '❌ 失敗', value: `${errorCount}`, inline: true },
                    { name: '📊 總計', value: `${refreshedCount + errorCount}`, inline: true }
                )
                .setTimestamp()
                .setFooter({
                    text: `由 ${interaction.user.tag} 執行`,
                    iconURL: interaction.user.displayAvatarURL()
                });

            await interaction.editReply({
                content: null,
                embeds: [embed]
            });

        } catch (_error) { }
    }
};

// 重新載入指令函數
async function refreshCommands(client) {
    let success = 0;
    let errors = 0;

    try {
        // 清除現有的指令
        client.commands.clear();

        // 讀取指令資料夾
        const commandsPath = path.join(__dirname, '..'); // 調整路徑以符合你的專案結構
        const commandFolders = fs.readdirSync(commandsPath).filter(folder =>
            fs.statSync(path.join(commandsPath, folder)).isDirectory() &&
            folder !== 'node_modules'
        );

        // 如果有 commands 資料夾，直接讀取
        if (fs.existsSync(path.join(commandsPath, 'commands'))) {
            const commandFiles = fs.readdirSync(path.join(commandsPath, 'commands'))
                .filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                try {
                    const filePath = path.join(commandsPath, 'commands', file);

                    // 清除快取
                    delete require.cache[require.resolve(filePath)];

                    // 重新載入指令
                    const command = require(filePath);

                    if ('data' in command && 'execute' in command) {
                        client.commands.set(command.data.name, command);
                        success++;
                    } else {
                        console.warn(`指令 ${file} 缺少必要的 "data" 或 "execute" 屬性`);
                        errors++;
                    }
                } catch (error) {
                    console.error(`載入指令 ${file} 時發生錯誤:`, error);
                    errors++;
                }
            }
        } else {
            // 如果沒有 commands 資料夾，搜尋所有 .js 檔案
            const commandFiles = getAllJSFiles(commandsPath)
                .filter(file => !file.includes('node_modules') && !file.includes('events'));

            for (const filePath of commandFiles) {
                try {
                    // 清除快取
                    delete require.cache[require.resolve(filePath)];

                    // 重新載入指令
                    const command = require(filePath);

                    if ('data' in command && 'execute' in command) {
                        client.commands.set(command.data.name, command);
                        success++;
                    }
                } catch (error) {
                    // 忽略非指令檔案的錯誤
                    continue;
                }
            }
        }

    } catch (error) {
        console.error('重新載入指令時發生錯誤:', error);
        errors++;
    }

    return { success, errors };
}

// 重新載入事件函數
async function refreshEvents(client) {
    let success = 0;
    let errors = 0;

    try {
        // 移除現有的事件監聽器（除了基本的事件）
        const protectedEvents = ['ready', 'interactionCreate'];

        client.eventNames().forEach(eventName => {
            if (!protectedEvents.includes(eventName)) {
                client.removeAllListeners(eventName);
            }
        });

        // 讀取事件資料夾
        const eventsPath = path.join(__dirname, '..'); // 調整路徑以符合你的專案結構

        // 如果有 events 資料夾，直接讀取
        if (fs.existsSync(path.join(eventsPath, 'events'))) {
            const eventFiles = fs.readdirSync(path.join(eventsPath, 'events'))
                .filter(file => file.endsWith('.js'));

            for (const file of eventFiles) {
                try {
                    const filePath = path.join(eventsPath, 'events', file);

                    // 清除快取
                    delete require.cache[require.resolve(filePath)];

                    // 重新載入事件
                    const event = require(filePath);

                    if (event.name) {
                        if (event.once) {
                            client.once(event.name, (...args) => event.execute(...args));
                        } else {
                            client.on(event.name, (...args) => event.execute(...args));
                        }
                        success++;
                    } else {
                        console.warn(`事件 ${file} 缺少必要的 "name" 屬性`);
                        errors++;
                    }
                } catch (error) {
                    console.error(`載入事件 ${file} 時發生錯誤:`, error);
                    errors++;
                }
            }
        } else {
            // 搜尋所有可能的事件檔案
            const eventFiles = getAllJSFiles(eventsPath)
                .filter(file =>
                    !file.includes('node_modules') &&
                    !file.includes('commands') &&
                    (file.includes('event') || file.includes('handler'))
                );

            for (const filePath of eventFiles) {
                try {
                    // 清除快取
                    delete require.cache[require.resolve(filePath)];

                    // 重新載入事件
                    const event = require(filePath);

                    if (event.name) {
                        if (event.once) {
                            client.once(event.name, (...args) => event.execute(...args));
                        } else {
                            client.on(event.name, (...args) => event.execute(...args));
                        }
                        success++;
                    }
                } catch (error) {
                    // 忽略非事件檔案的錯誤
                    continue;
                }
            }
        }

    } catch (error) {
        console.error('重新載入事件時發生錯誤:', error);
        errors++;
    }

    return { success, errors };
}

// 遞歸獲取所有 JS 檔案
function getAllJSFiles(dir) {
    let files = [];

    try {
        const items = fs.readdirSync(dir, { withFileTypes: true });

        for (const item of items) {
            const fullPath = path.join(dir, item.name);

            if (item.isDirectory() && item.name !== 'node_modules') {
                files = files.concat(getAllJSFiles(fullPath));
            } else if (item.isFile() && item.name.endsWith('.js')) {
                files.push(fullPath);
            }
        }
    } catch (error) {
        console.error(`讀取目錄 ${dir} 時發生錯誤:`, error);
    }

    return files;
}