# Updated version: slash commands removed, only monitoring + notify works
import os, imaplib, email, re, datetime, io, csv, asyncio, time
from email.header import decode_header, make_header
from email.utils import parsedate_to_datetime
import discord
from discord.ext import commands, tasks

# -------------------- CONFIG --------------------
DISCORD_TOKEN = ""
GMAIL_USER = ""
GMAIL_APP_PASSWORD = ""
NOTIFY_CHANNEL_ID = 1411457455392686270   # Auto alerts channel
FAMAPP_SENDER = "no-reply@famapp.in"

# -------------------- BOT --------------------
intents = discord.Intents.default()
bot = commands.Bot(command_prefix="!", intents=intents)
LAST_SEEN_UID = None
CACHE = []
CACHE_TIME = 60
CACHE_TIMESTAMP = 0

# -------------------- IMAP HELPERS --------------------
def _imap_connect():
    m = imaplib.IMAP4_SSL("imap.gmail.com")
    m.login(GMAIL_USER, GMAIL_APP_PASSWORD)
    m.select("inbox", readonly=True)
    return m

def _decode_header_value(raw):
    try:
        return str(make_header(decode_header(raw)))
    except:
        return str(raw)

def _extract_text(msg):
    text = ""
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain" and "attachment" not in str(part.get("Content-Disposition")):
                try:
                    text = part.get_payload(decode=True).decode(part.get_content_charset() or "utf-8", errors="ignore")
                    break
                except:
                    pass
    else:
        try:
            text = msg.get_payload(decode=True).decode("utf-8", errors="ignore")
        except:
            text = str(msg.get_payload())
    return text.strip()

def _parse_email(subject, body, header_date):
    txt = body.replace("\n", " ")
    low = txt.lower()
    typ = "info"
    if any(w in low for w in ["credited", "received", "successfully received"]):
        typ = "credit"
    elif any(w in low for w in ["payment", "paid", "debited"]):
        typ = "debit"

    amt = None
    if m := re.search(r"(?:₹\s*|inr\s*)(\d+(?:\.\d+)?)", txt, re.I):
        amt = f"₹{m.group(1)}"

    bal = None
    if m := re.search(r"updated balance (?:is|:)\s*(₹\s*\d+(?:\.\d+)?)", txt, re.I):
        bal = m.group(1).replace(" ", "")

    txn = None
    if m := re.search(r"(?:transaction id|txn id)\s*[:\-]?\s*([A-Z0-9]+)", txt, re.I):
        txn = m.group(1).strip()

    party = None
    if m := re.search(r"received\s+₹?\s*\d+(?:\.\d+)?\s+from\s+([A-Za-z0-9 ._\-@]+?)\s+(?:at|on|with|$)", txt, re.I):
        party = m.group(1).strip().title()
    elif m := re.search(r"paid\s+₹?\s*\d+(?:\.\d+)?\s+to\s+([A-Za-z0-9 ._\-@]+?)\s+(?:at|on|with|$)", txt, re.I):
        party = m.group(1).strip().title()

    dt = header_date or datetime.datetime.now()
    return {
        "type": typ,
        "amount": amt,
        "party": party,
        "txn": txn,
        "balance": bal,
        "date": dt.strftime("%d-%b-%Y %I:%M %p"),
        "dt_sort": dt,
        "subject": subject,
        "preview": (body[:200] + "...") if len(body) > 200 else body
    }

def fetch_emails(since_days=3):
    global CACHE, CACHE_TIMESTAMP
    now = time.time()
    if CACHE and (now - CACHE_TIMESTAMP) < CACHE_TIME:
        return CACHE
    try:
        m = _imap_connect()
        since_date = (datetime.date.today() - datetime.timedelta(days=since_days)).strftime("%d-%b-%Y")
        status, data = m.search(None, f'(FROM "{FAMAPP_SENDER}" SINCE {since_date})')
        if status != "OK":
            return CACHE
        uids = data[0].split()
        emails = []
        for uid in uids:
            status, msg_data = m.fetch(uid, "(RFC822)")
            if status != "OK":
                continue
            msg = email.message_from_bytes(msg_data[0][1])
            subject = _decode_header_value(msg.get("Subject", ""))
            try:
                header_date = parsedate_to_datetime(msg.get("Date")).replace(tzinfo=None)
            except:
                header_date = datetime.datetime.now()
            body = _extract_text(msg)
            parsed = _parse_email(subject, body, header_date)
            parsed["uid"] = uid
            emails.append(parsed)
        m.logout()
        emails.sort(key=lambda x: x["dt_sort"])
        CACHE = emails
        CACHE_TIMESTAMP = now
        return emails
    except Exception as e:
        print("Fetch error:", e)
        return CACHE

# -------------------- AUTO MONITOR --------------------
def payment_to_field(p):
    status = "✅ Credit" if p["type"] == "credit" else ("❌ Debit" if p["type"] == "debit" else "📩 Info")
    lines = []
    if p["amount"]:
        lines.append(f"💰 **Amount:** {p['amount']}")
    if p["txn"]:
        lines.append(f"🆔 **Txn ID:** `{p['txn']}`")
    if p["party"]:
        lines.append(f"👤 **Party:** {p['party']}")
    if p["balance"]:
        lines.append(f"💳 **Balance:** {p['balance']}")
    lines.append(f"📅 **Date:** {p['date']}")
    return status, "\n".join(lines)

import aiohttp

API_URL = "http://localhost:5000/api/payments/pending"

async def send_to_api(p):
    async with aiohttp.ClientSession() as session:
        payload = {
            "amount": p["amount"],
            "txn_id": p["txn"],
            "party": p["party"],
            "subject": p["subject"],
            "date": p["date"]
        }
        try:
            async with session.post(API_URL, json=payload) as resp:
                if resp.status == 201:
                    print(f"✅ Payment sent to website: {p['txn']}")
                else:
                    print(f"❌ Failed to send to website: {resp.status}")
        except Exception as e:
            print(f"❌ API Error: {e}")

@tasks.loop(seconds=15)
async def auto_check_mails():
    global LAST_SEEN_UID
    try:
        emails = fetch_emails(3)
        if not emails:
            return
        latest = emails[-1]
        uid = latest.get("uid")
        if LAST_SEEN_UID != uid:
            LAST_SEEN_UID = uid
            
            # Send to API
            await send_to_api(latest)

            ch = bot.get_channel(NOTIFY_CHANNEL_ID)
            if ch:
                name, val = payment_to_field(latest)
                embed = discord.Embed(title="📩 New Payment Alert!", description=f"**{latest['subject']}**", color=discord.Color.gold())
                embed.add_field(name=name, value=val, inline=False)
                await ch.send(embed=embed)
    except Exception as e:
        print("Auto monitor error:", e)

# -------------------- START --------------------
@bot.event
async def on_ready():
    print(f"✅ Bot ready as {bot.user}")
    auto_check_mails.start()

# -------------------- RUN --------------------
if __name__ == "__main__":
    bot.run(DISCORD_TOKEN)
