require('dotenv').config();
const { 
    Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    EmbedBuilder, ChannelType, PermissionsBitField, StringSelectMenuBuilder, 
    ModalBuilder, TextInputBuilder, TextInputStyle, UserSelectMenuBuilder,
    AttachmentBuilder
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// ==========================================
// ⚙️ CONFIGURAÇÕES DE CONFIGURAÇÃO DO SERVIDOR
// ==========================================
const COR_PF = 0x001f3f; // Azul Marinho Oficial
const CANAL_PAINEL_ID = '1509348730959167609'; // Canal onde o painel nascerá sozinho
const CATEGORIA_TICKET_ID = '1510441608485802004'; 
const CANAL_LOGS_ID = '1510441372556197958'; 

const IMAGEM_BANNER = 'https://i.imgur.com/PLZQlAe.png'; 
const IMAGEM_THUMBNAIL = 'https://i.imgur.com/IAlFgWc.png'; 

// ==========================================
// 🚀 EVENTO: READY (GERADOR AUTOMÁTICO DO PAINEL)
// ==========================================
client.once('ready', async () => {
    console.log(`✅ FenixBot2 operando como ${client.user.tag}!`);

    try {
        const canalPainel = await client.channels.fetch(CANAL_PAINEL_ID);
        if (!canalPainel || canalPainel.type !== ChannelType.GuildText) return;

        // Busca as últimas mensagens para checar se o painel já existe
        const mensagens = await canalPainel.messages.fetch({ limit: 10 });
        const painelExistente = mensagens.find(m => m.author.id === client.user.id && m.embeds.length > 0);

        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('selecionar_categoria')
                .setPlaceholder('📥 Selecione a categoria de atendimento...')
                .addOptions([
                    { label: 'Dúvidas', value: 'Dúvidas', description: 'Esclareça suas dúvidas com a equipe.', emoji: '❓' },
                    { label: 'Diretoria', value: 'Diretoria', description: 'Assuntos diretos com a Diretoria.', emoji: '👔' },
                    { label: 'Indicação', value: 'Indicação', description: 'Indique um novo membro.', emoji: '📝' },
                    { label: 'Outros', value: 'Outros', description: 'Outros tipos de assuntos ou suporte.', emoji: '⚙️' }
                ])
        );

        const embed = new EmbedBuilder()
            .setTitle('📁 CENTRAL DE ATENDIMENTO — POLÍCIA FEDERAL')
            .setDescription('Seja bem-vindo ao sistema de suporte integrado. Use o menu de seleção abaixo para abrir um ticket individualizado com os nossos departamentos.\n\n**⚠️ Diretrizes Importantes:**\n• Forneça o máximo de informações logo na abertura.\n• Evite marcações desnecessárias da equipe administrativa.\n• Abra apenas um chamado por assunto.')
            .setColor(COR_PF)
            .setFooter({ text: 'Sistema de Proteção e Atendimento ao Cidadão', iconURL: IMAGEM_THUMBNAIL });

        if (IMAGEM_BANNER) embed.setImage(IMAGEM_BANNER);
        if (IMAGEM_THUMBNAIL) embed.setThumbnail(IMAGEM_THUMBNAIL);

        if (painelExistente) {
            // Se já existir, apenas atualiza para garantir que está com os dados novos
            await painelExistente.edit({ embeds: [embed], components: [row] });
            console.log('🔄 Painel de atendimento atualizado com sucesso.');
        } else {
            // Se não existir, envia um novo
            await canalPainel.send({ embeds: [embed], components: [row] });
            console.log('🆕 Novo painel de atendimento enviado ao canal configurado.');
        }

    } catch (error) {
        console.error('⚠️ Erro na rotina de verificação do painel automático:', error);
    }
});

// ==========================================
// 🕹️ GERENCIAMENTO DE INTERAÇÕES E EVENTOS
// ==========================================
client.on('interactionCreate', async (interaction) => {
    
    // --- DISPARAR MODAL AO SELECIONAR CATEGORIA ---
    if (interaction.isStringSelectMenu() && interaction.customId === 'selecionar_categoria') {
        const categoria = interaction.values[0];

        const modal = new ModalBuilder()
            .setCustomId(`modal_ticket_${categoria}`)
            .setTitle(`Suporte: ${categoria}`);

        const inputAssunto = new TextInputBuilder()
            .setCustomId('input_assunto')
            .setLabel('Descreva brevemente o assunto ou motivo:')
            .setPlaceholder('Ex: Solicitação de ajuste de farda / Dúvida sobre recrutamento...')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(500);

        modal.addComponents(new ActionRowBuilder().addComponents(inputAssunto));
        await interaction.showModal(modal);
    }

    // --- PROCESSAR CRIAÇÃO DO TICKET ---
    if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_ticket_')) {
        const categoria = interaction.customId.split('_')[2];
        const assunto = interaction.fields.getTextInputValue('input_assunto');
        const ticketId = Math.random().toString(36).substring(2, 8).toUpperCase();

        await interaction.deferReply({ ephemeral: true });

        try {
            const channel = await interaction.guild.channels.create({
                name: `🎫-${categoria.toLowerCase()}-${ticketId}`,
                type: ChannelType.GuildText,
                parent: CATEGORIA_TICKET_ID,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles, PermissionsBitField.Flags.ReadMessageHistory] },
                    { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks] }
                ]
            });

            const embedTicket = new EmbedBuilder()
                .setTitle('👮 ATENDIMENTO EXCLUSIVO — POLÍCIA FEDERAL')
                .setDescription(`Olá ${interaction.user}, sua solicitação foi aberta na plataforma.\nAguarde em linha até que um oficial ou responsável pelo setor venha assumir o seu procedimento abaixo.`)
                .addFields(
                    { name: '🗂️ Setor Requisitado', value: `\`\`\`${categoria}\`\`\``, inline: true },
                    { name: '🛜 Protocolo', value: `\`\`\`#${ticketId}\`\`\``, inline: true },
                    { name: '📝 Detalhes Iniciais', value: `\`\`\`${assunto}\`\`\``, inline: false }
                )
                .setColor(COR_PF)
                .setTimestamp();

            if (IMAGEM_BANNER) embedTicket.setImage(IMAGEM_BANNER);

            const botoesTicket = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('assumir_ticket').setLabel('Assumir Ticket').setEmoji('🛡️').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('painel_admin').setLabel('Painel Admin').setEmoji('🔒').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('finalizar_ticket').setLabel('Finalizar Ticket').setEmoji('✖️').setStyle(ButtonStyle.Danger)
            );

            await channel.send({ embeds: [embedTicket], components: [botoesTicket] });
            await interaction.editReply({ content: `✅ Canal criado! Siga para o atendimento em: ${channel}` });

        } catch (erro) {
            console.error('Erro ao criar ticket:', erro);
            await interaction.editReply({ content: '❌ Houve um erro crítico ao configurar os canais de permissão.' });
        }
    }

    // --- TRATAMENTO DOS BOTÕES ---
    if (interaction.isButton()) {
        
        // --- ASSUMIR TICKET (NOME E CARGO REAL) ---
        if (interaction.customId === 'assumir_ticket') {
            const membro = await interaction.guild.members.fetch(interaction.user.id);
            const cargoMaisAlto = membro.roles.highest.name !== '@everyone' ? membro.roles.highest.name : 'Membro da Equipe';
            const nomeExibicao = membro.displayName;

            const embedAssumido = new EmbedBuilder()
                .setDescription(`🛡️ O ticket agora está sob a responsabilidade de **${nomeExibicao}** (${cargoMaisAlto}).`)
                .setColor(0x00FF7F);

            // Desativa o botão de assumir ticket para evitar cliques repetidos
            const componentesAtuais = interaction.message.components[0].components.map(botao => {
                const novoBotao = ButtonBuilder.from(botao);
                if (botao.customId === 'assumir_ticket') novoBotao.setDisabled(true);
                return novoBotao;
            });
            const linhaAtualizada = new ActionRowBuilder().addComponents(componentesAtuais);

            await interaction.message.edit({ components: [linhaAtualizada] });
            await interaction.reply({ embeds: [embedAssumido] });
        }

        // --- PAINEL ADMINISTRATIVO COM FILTRO REAL DE QUEM ESTÁ NO TICKET ---
        if (interaction.customId === 'painel_admin') {
            await interaction.deferReply({ ephemeral: true });

            const canal = interaction.channel;
            const membrosNoTicket = [];

            // Varre as permissões explícitas aplicadas diretamente neste canal de ticket
            const permissoesCanal = canal.permissionOverwrites.cache;
            
            for (const [id, overwrite] of permissoesCanal) {
                // Descarta o cargo @everyone, bots e o criador do comando para focar em outros usuários adicionados
                if (id === interaction.guild.id || id === client.user.id) continue;
                
                if (overwrite.allow.has(PermissionsBitField.Flags.ViewChannel)) {
                    try {
                        const targetMembro = await interaction.guild.members.fetch(id);
                        if (targetMembro && !targetMembro.user.bot) {
                            membrosNoTicket.push({
                                label: targetMembro.displayName,
                                value: targetMembro.id,
                                description: `ID: ${targetMembro.id}`
                            });
                        }
                    } catch {
                        // Ignora se o ID for de um cargo ou usuário inválido
                    }
                }
            }

            const adminEmbed = new EmbedBuilder()
                .setTitle('🔒 CONTROLE E AUDITORIA INTERNA')
                .setDescription('Ações reservadas para a liderança e oficiais encarregados do gerenciamento deste canal.')
                .setColor(0x2B2D31);

            const rowAdd = new ActionRowBuilder().addComponents(
                new UserSelectMenuBuilder().setCustomId('admin_add_user').setPlaceholder('➕ Adicionar novo membro ao canal')
            );

            const rowBotoes = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('admin_renomear').setLabel('Renomear Canal').setEmoji('✏️').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('admin_notificar').setLabel('Notificar Alerta').setEmoji('🔔').setStyle(ButtonStyle.Secondary)
            );

            // Se houver membros adicionados de forma extra, exibe a lista inteligente para remoção
            if (membrosNoTicket.length > 0) {
                const rowRemove = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('admin_remove_user_list')
                        .setPlaceholder('➖ Selecione quem deseja remover do ticket')
                        .addOptions(membrosNoTicket.slice(0, 25)) // O Discord limita menus a 25 opções
                );
                await interaction.editReply({ embeds: [adminEmbed], components: [rowAdd, rowRemove, rowBotoes] });
            } else {
                await interaction.editReply({ embeds: [adminEmbed], components: [rowAdd, rowBotoes] });
            }
        }

        // --- FINALIZAR TICKET COM CRONÔMETRO DE SEGURANÇA ---
        if (interaction.customId === 'finalizar_ticket') {
            await interaction.reply('🚨 **Procedimento de encerramento iniciado.** Coletando histórico e deletando a sala em 5 segundos...');

            setTimeout(async () => {
                try {
                    let mensagens = await interaction.channel.messages.fetch({ limit: 100 });
                    mensagens = Array.from(mensagens.values()).reverse(); 

                    let logTexto = `=== RELATÓRIO DE AUDITORIA: ${interaction.channel.name} ===\n`;
                    logTexto += `Encerrado por: ${interaction.user.tag}\n\n`;

                    mensagens.forEach(m => {
                        const dataHora = new Date(m.createdTimestamp).toLocaleString('pt-BR');
                        logTexto += `[${dataHora}] ${m.author.tag}: ${m.content}\n`;
                    });

                    const anexo = new AttachmentBuilder(Buffer.from(logTexto, 'utf-8'), { name: `auditoria-${interaction.channel.name}.txt` });
                    const canalLogs = interaction.guild.channels.cache.get(CANAL_LOGS_ID);

                    if (canalLogs) {
                        const embedLog = new EmbedBuilder()
                            .setTitle('🗃️ ARQUIVO DE AUDITORIA DISPONÍVEL')
                            .addFields(
                                { name: 'Identificador do Canal', value: `\`${interaction.channel.name}\``, inline: true },
                                { name: 'Operador Responsável', value: `${interaction.user}`, inline: true }
                            )
                            .setColor(COR_PF)
                            .setTimestamp();

                        await canalLogs.send({ embeds: [embedLog], files: [anexo] });
                    }

                    await interaction.channel.delete();

                } catch (erro) {
                    console.error('Erro na rotina de fechamento de log:', erro);
                    await interaction.channel.delete().catch(() => {});
                }
            }, 5000);
        }

        // --- ENVIAR NOTIFICAÇÃO DE ALERTA ---
        if (interaction.customId === 'admin_notificar') {
            await interaction.channel.send(`🔔 **Notificação Administrativa:** A diretoria solicita urgência e sua atenção imediata neste canal.`);
            await interaction.reply({ content: 'Aviso disparado na sala.', ephemeral: true });
        }

        // --- MODAL DE RENOMEAÇÃO ---
        if (interaction.customId === 'admin_renomear') {
            const modalRename = new ModalBuilder().setCustomId('modal_renomear').setTitle('Ajustar Identificador');
            const inputNome = new TextInputBuilder().setCustomId('novo_nome').setLabel('Novo sufixo do canal:').setStyle(TextInputStyle.Short).setRequired(true);
            modalRename.addComponents(new ActionRowBuilder().addComponents(inputNome));
            await interaction.showModal(modalRename);
        }
    }

    // --- CONTROLE DE MENUS DE SELEÇÃO ADMIN ---
    if (interaction.isUserSelectMenu() && interaction.customId === 'admin_add_user') {
        const userId = interaction.values[0];
        await interaction.channel.permissionOverwrites.edit(userId, { ViewChannel: true, SendMessages: true, AttachFiles: true, ReadMessageHistory: true });
        await interaction.reply({ content: `✅ <@${userId}> recebeu credenciais de acesso ao canal.`, ephemeral: true });
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'admin_remove_user_list') {
        const userId = interaction.values[0];
        await interaction.channel.permissionOverwrites.delete(userId);
        await interaction.reply({ content: `❌ <@${userId}> teve suas credenciais revogadas deste canal.`, ephemeral: true });
    }

    // --- SALVAR ALTERAÇÃO DE NOME ---
    if (interaction.isModalSubmit() && interaction.customId === 'modal_renomear') {
        const novoNome = interaction.fields.getTextInputValue('novo_nome').toLowerCase().replace(/\s+/g, '-');
        await interaction.channel.setName(`🎫-${novoNome}`);
        await interaction.reply({ content: `O canal foi renomeado com sucesso para: **🎫-${novoNome}**`, ephemeral: true });
    }
});

// ==========================================
// AUTH & CONEXÃO
// ==========================================
client.login(process.env.TOKEN);