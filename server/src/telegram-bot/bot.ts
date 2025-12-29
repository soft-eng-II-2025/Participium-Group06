import {Bot, BotError, Context, InlineKeyboard, session, SessionFlavor} from "grammy";
import {
    Conversation,
    ConversationFlavor,
    conversations,
    createConversation,
} from "@grammyjs/conversations";
import { getAllCategories } from "../controllers/userController";
import { addReport } from "../controllers/reportController";
import { getUserIdByTelegramUsername } from "../controllers/userController";

const token = process.env.BOT_TOKEN;
if (!token) {
    throw new Error("BOT_TOKEN is missing");
}

interface SessionData {
    userId?: number;
}


export type MyContext =
    Context &
    SessionFlavor<SessionData> &
    ConversationFlavor<any>;

// 2. Creiamo un'interfaccia base che unisce Context e Session
// Questo rompe la catena di riferimenti circolari
//interface BaseContext extends Context, SessionFlavor<SessionData> {}

// 3. Definiamo MyContext estendendo BaseContext e aggiungendo le conversazioni
//export type MyContext = BaseContext & ConversationFlavor<BaseContext>;

// 4. La conversazione userà il MyContext completo
export type MyConversation = Conversation<MyContext>;

// bot init
export const bot = new Bot<MyContext>(token);


bot.use(
    session<SessionData, MyContext>({
        initial: () => ({}),
    })
);

bot.use(conversations());

// /start
bot.command("start", async (ctx) => {
    const welcomeText =
        `<b>Hi ${ctx.from?.first_name}! Welcome to PARTICIPIUM</b> 👥🏔️📣\n\n` +
        `The platform that connects you with your community to report and resolve local issues.\n\n` +
        `<b>Cosa puoi fare con questo bot?</b>\n` +
        `• 🚩 <b>Nuova Segnalazione</b>\n` +
        `• 👤 <b>Anonimato</b>\n` +
        `• 📊 <b>Stato Report</b>\n\n` +
        `Clicca il tasto qui sotto per iniziare 👇`;

    console.log("telegram: " + ctx.from?.username);
    if (ctx.from?.username == undefined) {
        console.log("telegram username undefined");
        return await ctx.reply("❌ Errore: Non riesco a trovare il tuo account. Crea il tuo account prima di inserire una segnalazione");
    }
    const userId = await  getUserIdByTelegramUsername(ctx.from?.username);
    console.log("user id in telegram bot: " + userId);
    ctx.session.userId = userId;

    console.log("User ID salvato in sessione: " + ctx.session.userId);

    const keyboard = new InlineKeyboard()
        .text("➕ NUOVA SEGNALAZIONE", "new_report_start")
        .row()


    await ctx.reply(welcomeText, {
        parse_mode: "HTML",
        reply_markup: keyboard,
    });
});



// ======================
// CREATE REPORT WIZARD
// ======================
async function createReportWizard(
    conversation: MyConversation,
    ctx: MyContext
) {

    // Aggiungi un log di debug per vedere se la sessione esiste all'ingresso
    console.log("DEBUG: Sessione all'inizio del wizard:", ctx.session);

    // Controllo di sicurezza all'inizio del wizard
    if (!ctx.session.userId) {
        // Se non c'è, riproviamo a cercarlo al volo o chiediamo di fare /start
        const userId = await conversation.external(() =>
            getUserIdByTelegramUsername(ctx.from?.username!)
        );
        if (!userId) {
            return await ctx.reply("❌ Errore: Non riesco a trovare il tuo account. Crea il tuo account prima di inserire una segnalazione");
        }
        ctx.session.userId = userId;

    }

    if (ctx.session.userId == undefined) {
        console.log("ctx.session.userId == undefined")
        return;
    }

    // ---------- STEP 1: LOCATION ----------
    await ctx.reply(
        "📍 <b>Iniziamo!</b>\nInviami la posizione del problema:",
        {
            parse_mode: "HTML",
            reply_markup: {
                keyboard: [
                    [{ text: "📍 Condividi Posizione", request_location: true }],
                ],
                resize_keyboard: true,
                one_time_keyboard: true,
            },
        }
    );

    const locationCtx = await conversation.waitFor("message:location");
    const { latitude, longitude } = locationCtx.message.location;

    // ---------- STEP 2: TITLE ----------
    await ctx.reply(
        "📝 Inserisci un <b>titolo breve</b> per la segnalazione:",
        {
            parse_mode: "HTML",
            reply_markup: { remove_keyboard: true },
        }
    );

    const title = await conversation.form.text();

    // ---------- STEP 3: CATEGORY ----------

    const allCategories = await conversation.external(() => getAllCategories());

    const categoryKeyboard = new InlineKeyboard();

    allCategories.forEach((cat) => {
        // Usiamo un prefisso "cat:" per identificare i callback delle categorie
        categoryKeyboard.text(cat.name, `cat:${cat.id}`).row();
    });

    await ctx.reply("📁 Scegli una <b>categoria</b>:", {
        parse_mode: "HTML",
        reply_markup: categoryKeyboard,
    });

    const categoryQuery = await conversation.waitForCallbackQuery(/^cat:/);


    // Estraiamo l'ID vero e proprio (togliamo il prefisso "cat:")
    const selectedCategoryId = categoryQuery.callbackQuery.data.split(":")[1];
    const selectedCategoryName = allCategories.find(c => c.id.toString() === selectedCategoryId)?.name;

    await ctx.reply(`Hai selezionato: <b>${selectedCategoryName}</b>`, { parse_mode: "HTML" });





    // ---------- STEP 4: DESCRIPTION ----------
    await ctx.reply(
        "✍️ Inserisci una <b>descrizione dettagliata</b>:",
        { parse_mode: "HTML" }
    );

    const description = await conversation.form.text();

    // ---------- STEP 5: PHOTOS (MAX 3) ----------
    const photos: string[] = [];
    await ctx.reply("📸 Invia fino a <b>3 foto</b>. Quando hai finito, scrivi 'FINE'.");

    while (photos.length < 3) {
        const photoCtx = await conversation.waitFor(["message:photo", "message:text"]);
        if (photoCtx.message?.text?.toUpperCase() === "FINE") break;
        if (photoCtx.message?.photo) {
            const fileId = photoCtx.message.photo.pop()?.file_id;
            if (fileId) photos.push(fileId);
            await ctx.reply(`✅ Foto ${photos.length}/3 ricevuta. Inviane un'altra o scrivi 'FINE'.`);
        }
    }
    // ---------- STEP 6: ANONYMITY ----------
    const anonKeyboard = new InlineKeyboard()
        .text("Sì, Anonimo 🔒", "anon_true")
        .row()
        .text("No, Pubblico 👤", "anon_false");

    await ctx.reply(
        "🕵️ Vuoi inviare la segnalazione in modo <b>anonimo</b>?",
        {
            parse_mode: "HTML",
            reply_markup: anonKeyboard,
        }
    );

    const anonQuery = await conversation.waitForCallbackQuery([
        "anon_true",
        "anon_false",
    ]);

    await anonQuery.answerCallbackQuery();

    const isAnonymous = anonQuery.callbackQuery.data === "anon_true";

    // ---------- FINAL ----------
    await ctx.reply("⏳ <b>Invio segnalazione...</b>", {
        parse_mode: "HTML",
    });

    // 👉 QUI chiamerai il tuo backend con conversation.external()

    await conversation.external(() =>
        addReport({
            anonymous: isAnonymous,
            categoryId: Number(selectedCategoryId),
            description: description,
            latitude: latitude,
            longitude: longitude,
            photos: photos,
            title: title,
            userId: ctx.session.userId

        })
    );

/*
 title,
        description,
        latitude,
        longitude,
            categoryId: selectedCategoryId,
        photos,
        isAnonymous,
        telegramUserId: ctx.from!.id,
 */
    await ctx.reply(
        `✅ <b>Grazie!</b>\nLa segnalazione "<b>${title}</b>" è stata inviata con successo.`,
        { parse_mode: "HTML" }
    );
}

// ======================
// CONVERSATION REGISTER
// ======================
bot.use(createConversation(createReportWizard, "createReportWizard"));

// ======================
// COMMANDS & CALLBACKS
// ======================
bot.command("new_report_start", async (ctx) => {
    await ctx.conversation.enter("createReportWizard");
});

bot.callbackQuery("new_report_start", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter("createReportWizard");
});

// ======================
// OPTIONAL: ERROR HANDLER
// ======================
bot.catch((err: BotError<MyContext>) => {
    const ctx = err.ctx;
    console.error("Bot error:", err.error, ctx.update);
});