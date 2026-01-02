import { Bot, BotError, Context, InlineKeyboard, session, SessionFlavor } from "grammy";
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
import inside from "point-in-polygon";

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

// Login middleware
bot.use(async (ctx, next) => {
    if (!ctx.from) return next();

    // Already logged in
    if (ctx.session.user) {
        return next();
    }

    // Username mandatory
    if (!ctx.from.username) {
        await ctx.reply("❌ You must have a Telegram username to use this bot.");
        return;
    }

    // DB Lookup
    const userId = await getUserIdByTelegramUsername(ctx.from.username);

    if (!userId) {
        await ctx.reply(
            "❌ You are not registered on the platform.\n" +
            "👉 Please register on the website before sending a report."
        );
        return;
    }

    // Cache session
    ctx.session.user = {
        id: userId,
        telegramId: ctx.from.id,
        username: ctx.from.username,
    };

    console.log("LOGIN SUCCESS:", ctx.session.user);
    return next();
});

bot.use(conversations());

async function downloadTelegramFile(fileId: string, folder = "uploads") {
    const getFileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const getFileJson = await getFileRes.json();
    if (!getFileJson.ok) {
        throw new Error("Telegram getFile failed: " + JSON.stringify(getFileJson));
    }

    const filePath: string = getFileJson.result.file_path;
    if (!filePath) {
        throw new Error("No file_path returned from Telegram.");
    }

    const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
        throw new Error("Failed to download file from Telegram.");
    }
    const buffer = Buffer.from(await fileResponse.arrayBuffer());

    fs.mkdirSync(folder, { recursive: true });
    const fileName = path.basename(filePath);
    const savePath = path.join(folder, fileName);
    fs.writeFileSync(savePath, buffer);

    return `/uploads/${fileName}`;
}

// /start
bot.command("start", async (ctx: MyContext) => {
    const welcomeText =
        `<b>Hi ${ctx.from?.first_name}! Welcome to PARTICIPIUM</b> 👥🏔️📣\n\n` +
        `The platform that connects you with your community to report and resolve local issues.\n\n` +
        `<b>What can you do with this bot?</b>\n` +
        `• 🚩 <b>New Report</b>\n` +
        `• 👤 <b>Anonymity</b>\n` +
        `• 📊 <b>Report Status</b>\n\n` +
        `Click the button below to start 👇`;

    const keyboard = new InlineKeyboard()
        .text("➕ NEW REPORT", "new_report_start")
        .row();

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
    if (!ctx.session) ctx.session = {};

    if (!ctx.session.user) {
        const userId = await conversation.external(() =>
            getUserIdByTelegramUsername(ctx.from!.username!)
        );

        if (!userId) {
            await ctx.reply("❌ Registration required. Please sign up on the platform first.");
            return;
        }

        ctx.session.user = {
            id: userId,
            telegramId: ctx.from!.id,
            username: ctx.from!.username!,
        };
    }

    const userId = ctx.session.user.id;

    // Turin Boundary Coordinates [lon, lat]
    const TORINO_BOUNDARY = [
        [7.6599, 45.1585], [7.6800, 45.1550], [7.7011, 45.1504], [7.7150, 45.1450], // Nord (Venaria/Borgaro)
        [7.7348, 45.1325], [7.7500, 45.1200], [7.7650, 45.1000], [7.7680, 45.0850], // Nord-Est (Settimo)
        [7.7600, 45.0750], [7.7400, 45.0650], [7.7300, 45.0550], [7.7282, 45.0681], // Est (San Mauro/Collina)
        [7.7100, 45.0500], [7.7015, 45.0450], [7.6950, 45.0350], [7.6850, 45.0250], // Sud-Est (Pecetto/Moncalieri)
        [7.6749, 45.0118], [7.6600, 45.0050], [7.6416, 44.9972], [7.6250, 45.0000], // Sud (Moncalieri/Nichelino)
        [7.6152, 45.0145], [7.6000, 45.0200], [7.5878, 45.0298], [7.5850, 45.0450], // Sud-Ovest (Beinasco)
        [7.5826, 45.0611], [7.5750, 45.0650], [7.5600, 45.0660], [7.5511, 45.0674], // Ovest (Grugliasco/Rivoli)
        [7.5550, 45.0750], [7.5600, 45.0850], [7.5682, 45.0933], [7.5750, 45.1000], // Ovest (Collegno)
        [7.5900, 45.1100], [7.6046, 45.1157], [7.6150, 45.1300], [7.6256, 45.1402], // Nord-Ovest (Pianezza)
        [7.6400, 45.1500], [7.6599, 45.1585] // Chiusura su Venaria
    ];

    function isPointInTorino(lat: number, lon: number): boolean {
        return inside([lon, lat], TORINO_BOUNDARY);
    }

    // ---------- STEP 1: LOCATION ----------
    let latitude: number = 0;
    let longitude: number = 0;
    let locationValid = false;

    await ctx.reply(
        "📍 <b>Let's start!</b>\n\n" +
        "1. Click the paperclip icon 📎\n" +
        "2. Select <b>Location</b>\n" +
        "3. Move the pin on the map to pick the exact spot <b>within the City of Turin</b>.",
        {
            parse_mode: "HTML",
            reply_markup: { remove_keyboard: true }
        }
    );

    while (!locationValid) {
        const locationCtx = await conversation.waitFor("message:location");
        const loc = locationCtx.message.location;

        const check = await conversation.external(() => isPointInTorino(loc.latitude, loc.longitude));

        if (check) {
            latitude = loc.latitude;
            longitude = loc.longitude;
            locationValid = true;
            await ctx.reply("✅ Location confirmed within Turin boundaries.");
        } else {
            await ctx.reply(
                "⚠️ <b>Warning!</b>\n" +
                "The selected point is outside the municipality of Turin.\n\n" +
                "Please select a spot <b>inside the city</b> (e.g., drag the pin away from outskirts like Rivalta):",
                { parse_mode: "HTML" }
            );
        }
    }

    // ---------- STEP 2: TITLE ----------
    await ctx.reply(
        "📝 Enter a <b>short title</b> for your report:",
        { parse_mode: "HTML" }
    );
    const title = await conversation.form.text();

    // ---------- STEP 3: CATEGORY ----------
    const allCategories = await conversation.external(() => getAllCategories());
    const categoryKeyboard = new InlineKeyboard();
    allCategories.forEach((cat) => {
        categoryKeyboard.text(cat.name, `cat:${cat.id}`).row();
    });

    await ctx.reply("📁 Select a category:", { reply_markup: categoryKeyboard });

    const categoryQuery = await conversation.waitForCallbackQuery(/^cat:/);
    await categoryQuery.answerCallbackQuery();

    const selectedCategoryId = categoryQuery.callbackQuery.data.split(":")[1];
    const selectedCategoryName = allCategories.find(c => c.id.toString() === selectedCategoryId)?.name;
    await ctx.reply(`You selected: <b>${selectedCategoryName}</b>`, { parse_mode: "HTML" });

    // ---------- STEP 4: DESCRIPTION ----------
    await ctx.reply(
        "✍️ Enter a <b>detailed description</b> of the issue:",
        { parse_mode: "HTML" }
    );
    const description = await conversation.form.text();

    // ---------- STEP 5: PHOTOS (MAX 3) ----------
    const photoIds: string[] = [];
    const photos: string[] = [];

    await ctx.reply(
        "📸 Send 1 to 3 photos of the issue.\n\n" +
        "⚠️ IMPORTANT: Once sent, type or click <b>DONE</b> to confirm.",
        {
            parse_mode: "HTML",
            reply_markup: {
                keyboard: [[{ text: "DONE" }]],
                resize_keyboard: true,
                one_time_keyboard: false
            }
        }
    );

    while (true) {
        const photoCtx = await conversation.waitFor(["message:photo", "message:text"]);
        const msg = photoCtx.message;

        if (msg?.text?.toUpperCase() === "DONE") {
            if (photoIds.length === 0) {
                await ctx.reply("❌ You must send at least one photo.");
                continue;
            }
            break;
        }

        if (msg?.photo) {
            if (photoIds.length < 3) {
                const fileId = msg.photo.pop()?.file_id;
                if (fileId) photoIds.push(fileId);
            }
        }
    }

    await ctx.reply("⏳ Processing photos...");
    const localPaths = await conversation.external(async () => {
        const paths: string[] = [];
        for (const fId of photoIds) {
            const path = await downloadTelegramFile(fId);
            paths.push(path);
        }
        return paths;
    });

    photos.push(...localPaths);
    await ctx.reply(`✅ Uploaded ${photos.length} photo(s).`, {
        reply_markup: { remove_keyboard: true }
    });

    // ---------- STEP 6: ANONYMITY ----------
    const anonKeyboard = new InlineKeyboard()
        .text("Yes, Anonymous 🔒", "anon_true")
        .row()
        .text("No, Public 👤", "anon_false");

    await ctx.reply(
        "🕵️ Do you want to send this report <b>anonymously</b>?",
        { parse_mode: "HTML", reply_markup: anonKeyboard }
    );

    const anonQuery = await conversation.waitForCallbackQuery(["anon_true", "anon_false"]);
    await anonQuery.answerCallbackQuery();
    const isAnonymous = anonQuery.callbackQuery.data === "anon_true";

    // ---------- FINAL ----------
    await ctx.reply("⏳ <b>Sending report...</b>", { parse_mode: "HTML" });

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
        `✅ <b>Success!</b>\nThe report "<b>${title}</b>" has been submitted.`,
        { parse_mode: "HTML" }
    );
}

bot.use(createConversation(createReportWizard, "createReportWizard"));

bot.callbackQuery("new_report_start", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter("createReportWizard");
});

bot.catch((err: BotError<MyContext>) => {
    console.error("Bot error:", err.error);
});

bot.command("reset", async (ctx) => {
    ctx.session = { user: ctx.session.user };
    await ctx.conversation.exit();
    await ctx.reply("🔄 Session reset and active conversations closed.");
});