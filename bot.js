require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const db = require('./database');
const website = require('./website');

async function initialize() {
  try {
    // Initialize browser first
    await website.initBrowser();
    
    // Attempt login with retries
    let loggedIn = false;
    for (let i = 0; i < 3; i++) {
      loggedIn = await website.login();
      if (loggedIn) break;
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    if (!loggedIn) throw new Error('Failed to login to website');

    // Start Telegram bot
    const bot = new TelegramBot(process.env.BOT_TOKEN, {
      polling: true,
      request: {
        agentOptions: { 
          rejectUnauthorized: false 
        }
      }
    });

    let isBotActive = true;

    // Keyboards
    const userKeyboard = {
      reply_markup: {
        keyboard: [
          ['إنشاء حساب'], ['معلومات الحساب'],
          ['شحن حسابك'], ['سحب رصيد'], ['التواصل مع الدعم']
        ],
        resize_keyboard: true
      }
    };

    const adminKeyboard = {
      reply_markup: {
        keyboard: [
          ['إيقاف البوت', 'تشغيل البوت'],
          ['إرسال إشعار للجميع', 'رصيد الأدمن'],
          ['عدد المستخدمين', 'إحصائيات الشحن', 'إحصائيات السحب']
        ],
        resize_keyboard: true
      }
    };

    // State management
    const userStates = {};

    // Helper functions
    function isAdmin(user) {
      return user.username === process.env.TELEGRAM_ADMIN_USERNAME;
    }

    async function broadcastMessage(message) {
      const users = db.prepare('SELECT telegramId FROM users').all();
      for (const user of users) {
        try {
          await bot.sendMessage(user.telegramId, message);
        } catch (error) {
          console.error(`Broadcast failed to ${user.telegramId}:`, error);
        }
      }
    }

    // Command handlers
    bot.onText(/إنشاء حساب/, async (msg) => {
      if (!isBotActive) return;
      
      try {
        const user = db.prepare('SELECT * FROM users WHERE telegramId = ?').get(msg.from.id);
        if (user) {
          return bot.sendMessage(msg.chat.id, 'عذراً لا يمكن إنشاء أكثر من حساب...', userKeyboard);
        }
        
        userStates[msg.from.id] = { state: 'awaiting_username' };
        await bot.sendMessage(msg.chat.id, 'الرجاء إدخال اسم المستخدم:');
      } catch (error) {
        console.error('Account creation error:', error);
        bot.sendMessage(msg.chat.id, 'حدث خطأ، الرجاء المحاولة لاحقاً');
      }
    });

    // Message handler
    bot.on('message', async (msg) => {
      if (!msg.text || !isBotActive) return;

      try {
        const userId = msg.from.id;
        const state = userStates[userId];

        if (state?.state === 'awaiting_username') {
          userStates[userId] = {
            state: 'awaiting_password',
            username: msg.text + 'latabot'
          };
          await bot.sendMessage(msg.chat.id, 'الرجاء إدخال كلمة المرور:');
        }
        else if (state?.state === 'awaiting_password') {
          const password = msg.text;
          const success = await website.createUser(state.username, password);
          
          if (success) {
            db.prepare(`
              INSERT INTO users (telegramId, username, password) 
              VALUES (?, ?, ?)
            `).run(userId, state.username, password);
            await bot.sendMessage(msg.chat.id, 'تم إنشاء الحساب بنجاح!', userKeyboard);
          } else {
            await bot.sendMessage(msg.chat.id, 'فشل إنشاء الحساب، الرجاء المحاولة لاحقاً', userKeyboard);
          }
          delete userStates[userId];
        }
        else if (state?.state?.startsWith('awaiting_')) {
          const amount = parseInt(msg.text);
          if (isNaN(amount)) {
            return bot.sendMessage(msg.chat.id, 'قيمة غير صالحة، الرجاء إدخال رقم');
          }
          
          const user = db.prepare('SELECT * FROM users WHERE telegramId = ?').get(userId);
          const type = state.state.split('_')[1];
          
          const success = await website.updateBalance(user.username, amount, type);
          if (success) {
            db.prepare(`
              UPDATE users SET balance = balance ${type === 'topup' ? '+' : '-'} ? 
              WHERE telegramId = ?
            `).run(amount, userId);
            await bot.sendMessage(msg.chat.id, `تم ${type === 'topup' ? 'شحن' : 'سحب'} ${amount} بنجاح!`, userKeyboard);
          } else {
            await bot.sendMessage(msg.chat.id, 'فشلت العملية، الرجاء التواصل مع الدعم', userKeyboard);
          }
          delete userStates[userId];
        }
      } catch (error) {
        console.error('Message handling error:', error);
        bot.sendMessage(msg.chat.id, 'حدث خطأ غير متوقع، الرجاء المحاولة لاحقاً');
      }
    });

    // Admin commands
    bot.onText(/إيقاف البوت/, async (msg) => {
      if (!isAdmin(msg.from)) return;
      
      try {
        isBotActive = false;
        await broadcastMessage('البوت تحت الصيانة');
        await bot.sendMessage(msg.chat.id, 'تم إيقاف البوت', adminKeyboard);
      } catch (error) {
        console.error('Stop bot error:', error);
      }
    });

    bot.onText(/تشغيل البوت/, async (msg) => {
      if (!isAdmin(msg.from)) return;
      
      try {
        isBotActive = true;
        await broadcastMessage('عاد البوت للعمل');
        await bot.sendMessage(msg.chat.id, 'تم تشغيل البوت', adminKeyboard);
      } catch (error) {
        console.error('Start bot error:', error);
      }
    });

    console.log('Bot is running successfully!');
    
  } catch (error) {
    console.error('Initialization failed:', error);
    process.exit(1);
  }
}

initialize();
