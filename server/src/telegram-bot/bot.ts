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
import fs from "fs";
import path from "path";



const token = process.env.BOT_TOKEN;
if (!token) {
    throw new Error("BOT_TOKEN is missing");
}

interface SessionData {
    user?: {
        id: number;
        telegramId: number;
        username: string;
    };
}


export type MyContext =
    Context &
    SessionFlavor<SessionData> &
    ConversationFlavor<any>;


export type MyConversation = Conversation<MyContext>;

// bot init
export const bot = new Bot<MyContext>(token);



bot.use(
    session<SessionData, MyContext>({
        initial: () => ({}),
    })
);

// middleware di login
bot.use(async (ctx, next) => {
    // Se non c’è session o update non ha from → skip
    if (!ctx.from) return next();

    // Se già loggato → skip
    if (ctx.session.user) {
        return next();
    }

    // Username obbligatorio
    if (!ctx.from.username) {
        await ctx.reply("❌ Devi avere uno username Telegram.");
        return;
    }

    // Lookup DB
    const userId = await getUserIdByTelegramUsername(ctx.from.username);

    if (!userId) {
        await ctx.reply(
            "❌ Non risulti registrato sulla piattaforma.\n" +
            "👉 Registrati prima di inviare una segnalazione."
        );
        return;
    }

    // Cache
    ctx.session.user = {
        id: userId,
        telegramId: ctx.from.id,
        username: ctx.from.username,
    };

    console.log("LOGIN OK:", ctx.session.user);

    return next();
});

bot.use(conversations());


async function downloadTelegramFile(fileId: string, folder = "uploads") {
    // ottengo file_path da Telegram
    const getFileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const getFileJson = await getFileRes.json();
    if (!getFileJson.ok) {
        throw new Error("Telegram getFile failed: " + JSON.stringify(getFileJson));
    }

    const filePath: string = getFileJson.result.file_path;
    if (!filePath) {
        throw new Error("No file_path returned from Telegram.");
    }

    // Scarica il file dal server Telegram
    const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
        throw new Error("Failed to download file from Telegram.");
    }
    const buffer = Buffer.from(await fileResponse.arrayBuffer());

    // Salva su disco
    fs.mkdirSync(folder, { recursive: true });
    const fileName = path.basename(filePath); // es. "photo/file_123.jpg"
    const savePath = path.join(folder, fileName);
    fs.writeFileSync(savePath, buffer);

    // Ritorna il percorso relativo per l’upload nel DB
    return `/uploads/${fileName}`;
}


// /start
bot.command("start", async (ctx: MyContext) => {
    const welcomeText =
        `<b>Hi ${ctx.from?.first_name}! Welcome to PARTICIPIUM</b> 👥🏔️📣\n\n` +
        `The platform that connects you with your community to report and resolve local issues.\n\n` +
        `<b>Cosa puoi fare con questo bot?</b>\n` +
        `• 🚩 <b>Nuova Segnalazione</b>\n` +
        `• 👤 <b>Anonimato</b>\n` +
        `• 📊 <b>Stato Report</b>\n\n` +
        `Clicca il tasto qui sotto per iniziare 👇`;


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

    // gestisco la sessione
    if (!ctx.session) {
        ctx.session = {};
    }

    if (!ctx.session.user) {
        const userId = await conversation.external(() =>
            getUserIdByTelegramUsername(ctx.from!.username!)
        );

        if (!userId) {
            await ctx.reply(
                "❌ Non risulti registrato sulla piattaforma.\n" +
                "👉 Registrati prima di inviare una segnalazione."
            );
            return;
        }

        ctx.session.user = {
            id: userId,
            telegramId: ctx.from!.id,
            username: ctx.from!.username!,
        };
    }

    const userId = ctx.session.user.id;


    console.log("conversation sessione userId: " + userId);

    // ---------- STEP 1: LOCATION ----------
    // TODO: cambiare l'implementazione di stp 1 -> ora manda la posizione attuale
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
        categoryKeyboard.text(cat.name, `cat:${cat.id}`).row();
    });

    await ctx.reply("📁 Scegli una categoria:", { reply_markup: categoryKeyboard });

    const categoryQuery = await conversation.waitForCallbackQuery(/^cat:/);
    await categoryQuery.answerCallbackQuery(); // Rispondi subito per evitare lag

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
    const photoIds: string[] = []; // Salvo solo i file_id
    const photos: string[] = [];   // Qui salveremo i percorsi locali dopo -> ciò che passo al backend

    await ctx.reply(
        "📸 Invia da 1 a 3 foto (anche come album dalla galleria).\n\n" +
        "⚠️ IMPORTANTE: Una volta inviate, scrivi <b>FINE</b> per confermare.",
        {
            parse_mode: "HTML",
            reply_markup: {
                keyboard: [[{ text: "FINE" }]],
                resize_keyboard: true,
                one_time_keyboard: false
            }
        }
    );

    while (true) {
        const photoCtx = await conversation.waitFor(["message:photo", "message:text"]);
        const msg = photoCtx.message;
        // Gestione comando FINE
        if (msg?.text?.toUpperCase() === "FINE") {
            if (photoIds.length === 0) {
                await ctx.reply("❌ Devi inviare almeno una foto.");
                continue;
            }
            break; // Esci dal loop solo col tasto FINE
        }

        // Gestione Foto
        if (msg?.photo) {
            // Salviamo la foto solo se non abbiamo superato il limite
            if (photoIds.length < 3) {
                const fileId = msg.photo.pop()?.file_id;
                if (fileId) photoIds.push(fileId);
            }
            // NOTA: Se l'utente ne manda 4 o 10, il bot continua a "mangiarle"
            // restando in questo loop finché l'utente non preme FINE.
            // Questo evita che i messaggi extra finiscano nello step successivo.
        }
    }

    // DOWNLOAD
    await ctx.reply("⏳ Elaborazione foto in corso...");

    // Usiamo un unico external per processare tutto l'array
    const localPaths = await conversation.external(async () => {
        const paths: string[] = [];
        for (const fId of photoIds) {
            const path = await downloadTelegramFile(fId);
            paths.push(path);
        }
        return paths;
    });

    // copio i percorsi nell'array finale
    photos.push(...localPaths);

    // Conferma finale e rimozione tastiera
    await ctx.reply(`✅ Hai caricato ${photos.length} foto.`, {
        reply_markup: { remove_keyboard: true }
    });

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

    // Aspettiamo il click e rispondiamo subito
    const anonQuery = await conversation.waitForCallbackQuery(["anon_true", "anon_false"]);
    await anonQuery.answerCallbackQuery();

    const isAnonymous = anonQuery.callbackQuery.data === "anon_true";

    // ---------- FINAL ----------
    await ctx.reply("⏳ <b>Invio segnalazione...</b>", {
        parse_mode: "HTML",
    });

    // chiamo il backend
    await conversation.external(() =>
        addReport({
            anonymous: isAnonymous,
            categoryId: Number(selectedCategoryId),
            description: description,
            latitude: latitude,
            longitude: longitude,
            photos: photos,
            title: title,
            userId: userId

        })
    );

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

bot.command("reset", async (ctx) => {
    // Svuota la sessione
    ctx.session = { user: ctx.session.user }; // Manteniamo l'utente loggato ma resettiamo il resto
    // Forza l'uscita da ogni conversazione attiva
    await ctx.conversation.exit();
    await ctx.reply("🔄 Sessione resettata e conversazioni chiuse. Ora puoi riprovare.");
});