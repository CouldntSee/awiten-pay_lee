import os
from PIL import Image, ImageDraw, ImageFont

WIDTH = 1920
HEIGHT = 1080

BG_DARK = (5, 8, 20)
BG_LIGHTER = (18, 28, 62)
PANEL_BG = (15, 23, 42)
PANEL_BORDER = (45, 60, 95)
TEXT_WHITE = (248, 250, 252)
TEXT_MUTED = (148, 163, 184)
EMERALD = (16, 185, 129)
EMERALD_LIGHT = (52, 211, 153)
AMBER = (245, 158, 11)
AMBER_LIGHT = (251, 191, 36)
CYAN = (56, 189, 248)
ROSE = (244, 63, 94)
PURPLE = (167, 139, 250)

# Native SFNS font supports Philippine Peso symbol ₱ and full Unicode
FONT_MAIN = "/System/Library/Fonts/SFNS.ttf"
FONT_MONO = "/System/Library/Fonts/SFNSMono.ttf"

F_BLACK_84 = ImageFont.truetype(FONT_MAIN, 84)
F_BLACK_64 = ImageFont.truetype(FONT_MAIN, 64)
F_BLACK_56 = ImageFont.truetype(FONT_MAIN, 56)
F_BOLD_44 = ImageFont.truetype(FONT_MAIN, 44)
F_BOLD_36 = ImageFont.truetype(FONT_MAIN, 36)
F_BOLD_30 = ImageFont.truetype(FONT_MAIN, 30)
F_BOLD_26 = ImageFont.truetype(FONT_MAIN, 26)
F_BOLD_24 = ImageFont.truetype(FONT_MAIN, 24)
F_BOLD_22 = ImageFont.truetype(FONT_MAIN, 22)
F_BOLD_20 = ImageFont.truetype(FONT_MAIN, 20)
F_BOLD_18 = ImageFont.truetype(FONT_MAIN, 18)
F_BOLD_16 = ImageFont.truetype(FONT_MAIN, 16)
F_BOLD_14 = ImageFont.truetype(FONT_MAIN, 14)
F_BOLD_13 = ImageFont.truetype(FONT_MAIN, 13)
F_REG_22 = ImageFont.truetype(FONT_MAIN, 22)
F_REG_18 = ImageFont.truetype(FONT_MAIN, 18)
F_REG_16 = ImageFont.truetype(FONT_MAIN, 16)
F_REG_14 = ImageFont.truetype(FONT_MAIN, 14)

def create_base_canvas():
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_DARK)
    draw = ImageDraw.Draw(img)
    for y in range(HEIGHT):
        ratio = y / HEIGHT
        r = int(BG_DARK[0] + (BG_LIGHTER[0] - BG_DARK[0]) * ratio * 0.75)
        g = int(BG_DARK[1] + (BG_LIGHTER[1] - BG_DARK[1]) * ratio * 0.75)
        b = int(BG_DARK[2] + (BG_LIGHTER[2] - BG_DARK[2]) * ratio * 0.75)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))
        
    grid_color = (20, 32, 60)
    for x in range(0, WIDTH, 80):
        draw.line([(x, 0), (x, HEIGHT)], fill=grid_color, width=1)
    for y in range(0, HEIGHT, 80):
        draw.line([(0, y), (WIDTH, y)], fill=grid_color, width=1)
    return img

def draw_wrapped_text(draw, text, x, y, font, fill, max_width, line_spacing=6, align="left"):
    words = text.split()
    lines = []
    current_line = []
    
    for word in words:
        test_line = " ".join(current_line + [word])
        bbox = font.getbbox(test_line)
        w = bbox[2] - bbox[0]
        if w <= max_width:
            current_line.append(word)
        else:
            if current_line:
                lines.append(" ".join(current_line))
                current_line = [word]
            else:
                lines.append(word)
                current_line = []
    if current_line:
        lines.append(" ".join(current_line))
        
    curr_y = y
    for line in lines:
        bbox = font.getbbox(line)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        curr_x = x
        if align == "center":
            curr_x = x + (max_width - w) // 2
        elif align == "right":
            curr_x = x + max_width - w
        draw.text((curr_x, curr_y), line, font=font, fill=fill)
        curr_y += h + line_spacing
        
    return curr_y

def draw_header(draw, tag_text, title_text, subtitle_text, badge_text, slide_num):
    draw.text((100, 48), f"●  {tag_text.upper()}", font=F_BOLD_16, fill=CYAN)
    draw.text((100, 78), title_text, font=F_BOLD_44, fill=TEXT_WHITE)
    draw.text((100, 134), subtitle_text, font=F_REG_22, fill=TEXT_MUTED)
    
    badge_w = 340
    draw.rounded_rectangle([WIDTH - 100 - badge_w, 54, WIDTH - 100, 96], radius=20, fill=(15, 30, 60), outline=CYAN, width=1)
    draw.text((WIDTH - 100 - badge_w + 24, 66), badge_text, font=F_BOLD_14, fill=CYAN)
    draw.text((WIDTH - 100 - badge_w - 95, 66), f"{slide_num:02d} / 10", font=F_BOLD_18, fill=TEXT_MUTED)

def draw_footer_banner(draw, text_left, text_right=""):
    y1 = 960
    y2 = 1022
    draw.rounded_rectangle([100, y1, WIDTH - 100, y2], radius=12, fill=(12, 35, 30), outline=EMERALD, width=1)
    draw.text((130, y1 + 18), text_left, font=F_BOLD_18, fill=EMERALD_LIGHT)
    if text_right:
        bbox = F_BOLD_18.getbbox(text_right)
        w = bbox[2] - bbox[0]
        draw.text((WIDTH - 130 - w, y1 + 18), text_right, font=F_BOLD_18, fill=TEXT_WHITE)

def draw_card(draw, x, y, w, h, fill=PANEL_BG, outline=PANEL_BORDER, radius=16):
    draw.rounded_rectangle([x, y, x + w, y + h], radius=radius, fill=fill, outline=outline, width=1)

# ==============================================================================
# SLIDE 1: Title / Hook
# ==============================================================================
def make_slide_1():
    img = create_base_canvas()
    draw = ImageDraw.Draw(img)
    
    badge_w = 340
    draw.rounded_rectangle([(WIDTH - badge_w)//2, 140, (WIDTH + badge_w)//2, 185], radius=22, fill=(15, 30, 60), outline=CYAN, width=1)
    draw.text(((WIDTH - badge_w)//2 + 28, 153), "STELLAR • SOROBAN • VELO SDK", font=F_BOLD_16, fill=CYAN)
    
    icon_path = "30_Deliverables/awiten-pay/apps/web/assets/awiten-icon.png"
    if os.path.exists(icon_path):
        icon = Image.open(icon_path).convert("RGBA")
        icon = icon.resize((130, 130), Image.Resampling.LANCZOS)
        img.paste(icon, (WIDTH // 2 - 340, 240), icon)
    
    draw.text((WIDTH // 2 - 180, 255), "AWITEN", font=F_BLACK_84, fill=EMERALD)
    draw.text((WIDTH // 2 + 225, 255), ".PAY", font=F_BLACK_84, fill=AMBER)
    
    sub = "Autonomous Cargo Liquidation & Escrow Agent on Stellar"
    bbox = F_BOLD_30.getbbox(sub)
    draw.text(((WIDTH - (bbox[2] - bbox[0]))//2, 385), sub, font=F_BOLD_30, fill=CYAN)
    
    card_w = 520
    card_h = 320
    card_y = 490
    gap = 60
    start_x = (WIDTH - (3 * card_w + 2 * gap)) // 2
    
    metrics = [
        ("1.5h", CYAN, "RUL SHELF LIFE LEFT", "Critical Thermal Limit on Highway"),
        ("8.5h", AMBER, "TRAVEL TIME TO MANILA", "Unavoidable Wholesale Lag Time"),
        ("+₱117,980", EMERALD_LIGHT, "SAVED PER 8-TON LOAD", "Net Value Rescued vs Terminal Rot")
    ]
    
    for i, (val, col, lbl, desc) in enumerate(metrics):
        cx = start_x + i * (card_w + gap)
        draw_card(draw, cx, card_y, card_w, card_h)
        draw.line([(cx + 20, card_y + 3), (cx + card_w - 20, card_y + 3)], fill=col, width=3)
        draw.text((cx + 36, card_y + 45), val, font=F_BLACK_64, fill=col)
        draw.text((cx + 36, card_y + 155), lbl, font=F_BOLD_20, fill=TEXT_WHITE)
        draw.text((cx + 36, card_y + 205), desc, font=F_REG_18, fill=TEXT_MUTED)
        
    draw_footer_banner(draw, "DICT Philippine Startup Challenge XI Region 1 — Top 2 Winner", "Team WalangKenen · Universidad de Dagupan")
    return img

# ==============================================================================
# SLIDE 2: Problem
# ==============================================================================
def make_slide_2():
    img = create_base_canvas()
    draw = ImageDraw.Draw(img)
    draw_header(draw, "01 · Problem Statement", "The 4 Highway Financial Breakdowns", "Why Diverting A Wilting Truck Fails In The Real World", "HIGH-HEAT TRANSIT CRISIS", 2)
    
    draw.rounded_rectangle([100, 195, WIDTH - 100, 255], radius=10, fill=(40, 15, 25), outline=ROSE, width=1)
    draw.text((130, 213), "ALERT METRIC: 34.2°C CANOPY HEAT", font=F_BOLD_18, fill=ROSE)
    draw.text((WIDTH - 580, 213), "1.5h SHELF LIFE LEFT vs. 8.5h MANILA ETA", font=F_BOLD_18, fill=ROSE)
    
    card_w = 405
    card_h = 620
    gap = 33
    start_x = 100
    card_y = 290
    
    problems = [
        ("BREAKDOWN 01", "Driver Cash Fraud\n(\"Bawas\")", 
         "Fake distress claims, fuel advance skimming, and under-reported dock cash.",
         "ZERO CASH GUARDRAIL"),
        ("BREAKDOWN 02", "2:00 AM Liquidity\nParalysis",
         "Co-op asleep, banks closed, 12 mins before passing the exit ramp.",
         "5-SEC AGENT ADVANCE"),
        ("BREAKDOWN 03", "Gate-Side Slashing\n(\"Bakaw\")",
         "Brokers slash price 67% (₱45/kg → ₱15/kg) upon wilted arrival.",
         "₱32/KG VELO FLOOR"),
        ("BREAKDOWN 04", "3-Party Escrow\nGridlock",
         "Manila deposit, driver fuel advance, and rescue buyer collide.",
         "ATOMIC 3-WAY UNWIND")
    ]
    
    for i, (pill, title, desc, tag_bottom) in enumerate(problems):
        cx = start_x + i * (card_w + gap)
        draw_card(draw, cx, card_y, card_w, card_h)
        
        draw.rounded_rectangle([cx + 28, card_y + 32, cx + 195, card_y + 66], radius=6, fill=(35, 25, 15), outline=AMBER, width=1)
        draw.text((cx + 40, card_y + 40), pill, font=F_BOLD_14, fill=AMBER)
        
        draw.text((cx + 28, card_y + 96), title, font=F_BOLD_30, fill=TEXT_WHITE)
        
        draw_wrapped_text(draw, desc, cx + 28, card_y + 215, F_REG_22, CYAN, card_w - 56, line_spacing=10)
        
        draw.rounded_rectangle([cx + 28, card_y + card_h - 86, cx + card_w - 28, card_y + card_h - 32], radius=8, fill=(15, 30, 45), outline=PANEL_BORDER, width=1)
        draw.text((cx + 44, card_y + card_h - 68), tag_bottom, font=F_BOLD_16, fill=EMERALD_LIGHT)
            
    draw_footer_banner(draw, "RESULT OF INACTION: Terminal produce spoilage, 2,000 kg dumped to landfill, -₱278,000 co-op capital loss.")
    return img

# ==============================================================================
# SLIDE 3: Solution
# ==============================================================================
def make_slide_3():
    img = create_base_canvas()
    draw = ImageDraw.Draw(img)
    draw_header(draw, "02 · Solution Architecture", "5-Minute Autonomous Rescue Loop", "Replacing Manual Phone Calls with Deterministic Agentic Execution", "STELLAR SMART CONTRACTS", 3)
    
    card_w = 325
    card_h = 675
    gap = 24
    start_x = 100
    card_y = 230
    
    steps = [
        ("STEP 01", "01 Lock Escrow", "₱360k Manila deposit locked; AI agent capped.", "36.00 XLM", "LOCKED DEPOSIT"),
        ("STEP 02", "02 Sense & Verify", "Pod detects RUL < ETA; pays x402 route oracle.", "1.00 XLM", "HTTP 402 ORACLE"),
        ("STEP 03", "03 Advance Fuel", "Sends ₱6,500 toll & diesel advance in 5 sec.", "6.50 XLM", "DRIVER ADVANCE"),
        ("STEP 04", "04 Flash-Sell", "Bulacan processor locks ₱256k (@ ₱32/kg) via Velo.", "25.60 XLM", "VELO CHECKOUT"),
        ("STEP 05", "05 Atomic Payout", "Dual NFC dock tap refunds Manila & pays Co-op.", "₱237,980", "CO-OP NET PAYOUT")
    ]
    
    for i, (pill, title, desc, stat, stat_lbl) in enumerate(steps):
        cx = start_x + i * (card_w + gap)
        draw_card(draw, cx, card_y, card_w, card_h, outline=(25, 60, 45))
        
        draw.rounded_rectangle([cx + 24, card_y + 28, cx + 130, card_y + 60], radius=6, fill=(15, 35, 25), outline=EMERALD, width=1)
        draw.text((cx + 36, card_y + 36), pill, font=F_BOLD_14, fill=EMERALD_LIGHT)
        
        draw.text((cx + 24, card_y + 92), title, font=F_BOLD_26, fill=TEXT_WHITE)
        
        draw_wrapped_text(draw, desc, cx + 24, card_y + 155, F_REG_22, CYAN, card_w - 48, line_spacing=8)
        
        draw.rounded_rectangle([cx + 24, card_y + card_h - 170, cx + card_w - 24, card_y + card_h - 36], radius=12, fill=(10, 25, 35), outline=CYAN, width=1)
        draw.text((cx + 36, card_y + card_h - 148), stat, font=F_BOLD_36, fill=EMERALD_LIGHT)
        draw.text((cx + 36, card_y + card_h - 82), stat_lbl, font=F_BOLD_14, fill=TEXT_MUTED)
            
    draw_footer_banner(draw, "Zero Driver Cash Handling  •  Execution Time: < 5 Minutes", "+₱117,980 (+98.3%) Net Salvage Recovery")
    return img

# ==============================================================================
# SLIDE 4: Target Market
# ==============================================================================
def make_slide_4():
    img = create_base_canvas()
    draw = ImageDraw.Draw(img)
    draw_header(draw, "03 · Market Sizing", "Target Market: High-Risk Corridors", "Highland-to-Urban Produce Hauling on Agentic Payment Rails", "TAM · SAM · SOM", 4)
    
    card_w = 540
    card_h = 670
    gap = 50
    start_x = 100
    card_y = 230
    
    markets = [
        ("TAM · TOTAL ADDRESSABLE MARKET", "₱45B", CYAN, "Annual PH Fresh Produce Freight",
         "14M metric tons domestic agricultural freight volume"),
        ("SAM · SERVICEABLE ADDRESSABLE MARKET", "₱12B", AMBER_LIGHT, "Highland Unrefrigerated Viajero Haulers",
         "95%+ open-canvas trucks · 20%–42% thermal spoilage"),
        ("SOM · SERVICEABLE OBTAINABLE MARKET", "₱1.8B", EMERALD_LIGHT, "Benguet Co-ops on Agentic Payment Rails",
         "500+ Viajero trucks · Pre-contracted Bulacan dehydrators")
    ]
    
    for i, (pill, val, col, title, sub_line) in enumerate(markets):
        cx = start_x + i * (card_w + gap)
        draw_card(draw, cx, card_y, card_w, card_h, outline=(30, 50, 80))
        
        draw.text((cx + 40, card_y + 56), pill, font=F_BOLD_16, fill=CYAN)
        draw.text((cx + 40, card_y + 120), val, font=F_BLACK_84, fill=col)
        draw_wrapped_text(draw, title, cx + 40, card_y + 280, F_BOLD_30, TEXT_WHITE, card_w - 80, line_spacing=8)
        draw.line([(cx + 40, card_y + 410), (cx + card_w - 40, card_y + 410)], fill=PANEL_BORDER, width=1)
        draw_wrapped_text(draw, sub_line, cx + 40, card_y + 450, F_REG_22, TEXT_MUTED, card_w - 80, line_spacing=8)
            
    draw_footer_banner(draw, "Primary Artery: Benguet (BAPTC) • TPLEX • NLEX • Bulacan Agro-Dehydrators • Manila Wholesale Bagsakan")
    return img

# ==============================================================================
# SLIDE 5: Product
# ==============================================================================
def make_slide_5():
    img = create_base_canvas()
    draw = ImageDraw.Draw(img)
    draw_header(draw, "04 · Core Technology", "The 3 Core Moving Parts", "Zero-Retrofit Hardware Attestation · Soroban Vaults · Velo Payment Engine", "PRODUCT STACK", 5)
    
    img_x, img_y, img_w, img_h = 100, 230, 800, 670
    draw_card(draw, img_x, img_y, img_w, img_h)
    
    proto_path = "30_Deliverables/awiten-pay/apps/web/assets/awiten-rev1-prototype.jpg"
    if os.path.exists(proto_path):
        proto = Image.open(proto_path).convert("RGB")
        proto = proto.resize((img_w - 16, img_h - 16), Image.Resampling.LANCZOS)
        img.paste(proto, (img_x + 8, img_y + 8))
        
    draw.rounded_rectangle([img_x + 24, img_y + img_h - 75, img_x + 480, img_y + img_h - 25], radius=8, fill=(5, 8, 20), outline=EMERALD, width=1)
    draw.text((img_x + 40, img_y + img_h - 60), "REV-1 TELEMETRY POD PROTOTYPE", font=F_BOLD_16, fill=EMERALD_LIGHT)
    
    start_x = 940
    card_w = 880
    pillar_h = 205
    gap = 27
    
    pillars = [
        ("01 HARDWARE POD", EMERALD_LIGHT, "REV-1 Telemetry Pod",
         "₱2,350 BOM · Clip-on Temp/RH + NFC · Cryptographic hardware proof."),
        ("02 SMART CONTRACT", CYAN, "Guardrailed AI Escrow",
         "50 XLM cap · 24-hr expiry · Autonomous x402 & fuel advances."),
        ("03 FINTECH RAILS", AMBER_LIGHT, "Velo Checkout & Gas",
         "Instant buyer checkout links · 0% crypto gas fees for users.")
    ]
    
    for i, (pill, col, title, desc) in enumerate(pillars):
        py = 230 + i * (pillar_h + gap)
        draw_card(draw, start_x, py, card_w, pillar_h)
        
        draw.rounded_rectangle([start_x + 28, py + 28, start_x + 215, py + 60], radius=6, fill=(15, 30, 45), outline=col, width=1)
        draw.text((start_x + 40, py + 36), pill, font=F_BOLD_14, fill=col)
        
        draw.text((start_x + 235, py + 28), title, font=F_BOLD_30, fill=TEXT_WHITE)
        draw.text((start_x + 28, py + 108), desc, font=F_REG_22, fill=CYAN)
            
    draw_footer_banner(draw, "Zero Vehicle Rewiring  •  Clip-On Deployment in 10 Seconds  •  IP67 Weatherproof Enclosure")
    return img

# ==============================================================================
# SLIDE 6: Go-to-Market
# ==============================================================================
def make_slide_6():
    img = create_base_canvas()
    draw = ImageDraw.Draw(img)
    draw_header(draw, "05 · Market Strategy", "Go-to-Market: Corridor Rollout", "Capturing Freight Supply and Industrial Off-Take Demand Concurrently", "CORRIDOR EXPANSION", 6)
    
    card_w = 540
    card_h = 670
    gap = 50
    start_x = 100
    card_y = 230
    
    phases = [
        ("PHASE 01 · BEACHHEAD", EMERALD_LIGHT, "01 Co-op Pilots (Benguet)", "Equip 50 Viajero trucks (₱2,000/mo pod + console SaaS).", "₱2,000 / Mo SaaS"),
        ("PHASE 02 · OFF-TAKE", AMBER_LIGHT, "02 Industrial Off-Takers", "Pre-contract Bulacan & Tarlac dehydrators + NFC docks.", "₱12–₱32/kg Floors"),
        ("PHASE 03 · SCALE", CYAN, "03 National Corridors", "Scale to Nueva Vizcaya (NVAT), Mindanao & Visayas routes.", "National Artery")
    ]
    
    for i, (pill, col, title, desc, stat) in enumerate(phases):
        cx = start_x + i * (card_w + gap)
        draw_card(draw, cx, card_y, card_w, card_h)
        
        draw.rounded_rectangle([cx + 36, card_y + 40, cx + 250, card_y + 74], radius=6, fill=(15, 30, 45), outline=col, width=1)
        draw.text((cx + 48, card_y + 49), pill, font=F_BOLD_14, fill=col)
        
        draw.text((cx + 36, card_y + 115), title, font=F_BOLD_30, fill=TEXT_WHITE)
        draw_wrapped_text(draw, desc, cx + 36, card_y + 185, F_REG_22, CYAN, card_w - 72, line_spacing=10)
        
        draw.rounded_rectangle([cx + 36, card_y + card_h - 140, cx + card_w - 36, card_y + card_h - 44], radius=12, fill=(10, 25, 40), outline=CYAN, width=1)
        draw.text((cx + 56, card_y + card_h - 110), stat, font=F_BOLD_36, fill=col)
            
    draw_footer_banner(draw, "Dual Lock-in: Fleets install hardware pods · Processors install stationary NFC weighbridge docks.")
    return img

# ==============================================================================
# SLIDE 7: Competitive Landscape
# ==============================================================================
def make_slide_7():
    img = create_base_canvas()
    draw = ImageDraw.Draw(img)
    draw_header(draw, "06 · Competitive Advantage", "Competitive Landscape", "Why Alerting A Sleeping Human Fails At 3:00 AM", "AUTONOMOUS vs. PASSIVE", 7)
    
    col_w = 830
    col_h = 670
    start_x = 100
    gap = 60
    card_y = 230
    
    lx = start_x
    draw_card(draw, lx, card_y, col_w, col_h, fill=(20, 15, 25), outline=ROSE)
    
    draw.rounded_rectangle([lx + 36, card_y + 36, lx + 270, card_y + 68], radius=6, fill=(40, 15, 20), outline=ROSE, width=1)
    draw.text((lx + 48, card_y + 44), "CONVENTIONAL FLEET TECH", font=F_BOLD_13, fill=ROSE)
    draw.text((lx + 36, card_y + 90), "Standard Telematics & Chatbots", font=F_BOLD_30, fill=TEXT_WHITE)
    
    legacy_pts = [
        ("3:00 AM Passive Alerts", "Sends unread notifications to sleeping managers."),
        ("₱0 Spending Power", "Cannot buy weather oracle data or disburse fuel tolls."),
        ("0% Floor Price Protection", "Cargo sits helpless while brokers slash price 67%.")
    ]
    
    ly = card_y + 165
    for title, desc in legacy_pts:
        draw.text((lx + 36, ly), f"—  {title}", font=F_BOLD_24, fill=ROSE)
        ly += 38
        draw.text((lx + 66, ly), desc, font=F_REG_22, fill=TEXT_MUTED)
        ly += 68
        
    draw.rounded_rectangle([lx + 36, card_y + col_h - 90, lx + col_w - 36, card_y + col_h - 30], radius=10, fill=(30, 10, 15), outline=ROSE, width=1)
    draw.text((lx + 56, card_y + col_h - 68), "OUTCOME: Blind Haul & Gate-Side Slashing Loss (-₱278,000)", font=F_BOLD_18, fill=ROSE)
    
    rx = start_x + col_w + gap
    draw_card(draw, rx, card_y, col_w, col_h, fill=(10, 25, 30), outline=EMERALD)
    
    draw.rounded_rectangle([rx + 36, card_y + 36, rx + 270, card_y + 68], radius=6, fill=(15, 35, 25), outline=EMERALD, width=1)
    draw.text((rx + 48, card_y + 44), "AUTONOMOUS STELLAR AGENT", font=F_BOLD_13, fill=EMERALD_LIGHT)
    draw.text((rx + 36, card_y + 90), "AWITEN-Pay Agentic Architecture", font=F_BOLD_30, fill=TEXT_WHITE)
    
    awiten_pts = [
        ("5-Second Autonomous Fuel Advance", "Pays x402 oracle & driver fuel toll advance on the fly."),
        ("Instant Velo Floor Checkout", "Locks processor ₱32/kg rescue contract before unloading."),
        ("Hard Smart-Contract Spending Caps", "50 XLM limit & hardware attestation eliminate fraud.")
    ]
    
    ry = card_y + 165
    for title, desc in awiten_pts:
        draw.text((rx + 36, ry), f"+  {title}", font=F_BOLD_24, fill=EMERALD_LIGHT)
        ry += 38
        draw.text((rx + 66, ry), desc, font=F_REG_22, fill=TEXT_WHITE)
        ry += 68
        
    draw.rounded_rectangle([rx + 36, card_y + col_h - 90, rx + col_w - 36, card_y + col_h - 30], radius=10, fill=(12, 35, 25), outline=EMERALD, width=1)
    draw.text((rx + 56, card_y + col_h - 68), "OUTCOME: Autonomous Liquidation & Co-op Net Salvage (+₱117,980)", font=F_BOLD_18, fill=EMERALD_LIGHT)
    
    draw_footer_banner(draw, "Moat: Cryptographic hardware attestation coupled with autonomous on-chain clearing power.")
    return img

# ==============================================================================
# SLIDE 8: Team & Validation
# ==============================================================================
def make_slide_8():
    img = create_base_canvas()
    draw = ImageDraw.Draw(img)
    draw_header(draw, "07 · Founders & Execution", "Team & Validation", "Team WalangKenen — Universidad de Dagupan", "DICT PSC XI REGION 1 WINNER", 8)
    
    draw.rounded_rectangle([100, 195, WIDTH - 100, 255], radius=10, fill=(15, 35, 55), outline=CYAN, width=1)
    draw.text((130, 213), "★  Top 2 Winner — DICT Philippine Startup Challenge XI (Region 1 Qualifier out of 55 Entries)", font=F_BOLD_18, fill=CYAN)
    
    card_w = 540
    card_h = 670
    gap = 50
    start_x = 100
    card_y = 280
    
    team = [
        ("SYSTEMS ARCHITECT", "John Dominic Ragudo", "BS Computer Engineering", "Autonomous Decision Engine & Soroban Smart Contracts"),
        ("HARDWARE LEAD", "CpE Co-Founder", "BS Computer Engineering", "REV-1 Telemetry Pod (₱2,350 BOM) & Hardware Attestation"),
        ("PLATFORM LEAD", "IT Co-Founder", "BS Information Technology", "3-Portal Clearinghouse Web Platform & Velo Checkout Rails")
    ]
    
    for i, (pill, name, dept, role) in enumerate(team):
        cx = start_x + i * (card_w + gap)
        draw_card(draw, cx, card_y, card_w, 620)
        
        draw.rounded_rectangle([cx + 40, card_y + 44, cx + 235, card_y + 78], radius=6, fill=(15, 35, 25), outline=EMERALD, width=1)
        draw.text((cx + 52, card_y + 53), pill, font=F_BOLD_14, fill=EMERALD_LIGHT)
        
        draw.text((cx + 40, card_y + 120), name, font=F_BOLD_36, fill=TEXT_WHITE)
        draw.text((cx + 40, card_y + 185), dept, font=F_BOLD_22, fill=CYAN)
        draw.line([(cx + 40, card_y + 250), (cx + card_w - 40, card_y + 250)], fill=PANEL_BORDER, width=1)
        draw_wrapped_text(draw, role, cx + 40, card_y + 290, F_REG_22, AMBER_LIGHT, card_w - 80, line_spacing=10)
            
    draw_footer_banner(draw, "Institution: Universidad de Dagupan · College of Information Technology and Engineering")
    return img

# ==============================================================================
# SLIDE 9: Key Financials
# ==============================================================================
def make_slide_9():
    img = create_base_canvas()
    draw = ImageDraw.Draw(img)
    draw_header(draw, "08 · Unit Economics", "8-Ton Load Ledger & Unit Economics", "Salvage Accounting for 8,000 kg Benguet Cabbage Load", "FINANCIAL AUDIT", 9)
    
    table_x = 100
    table_y = 230
    table_w = WIDTH - 200
    row_h = 75
    
    draw_card(draw, table_x, table_y, table_w, row_h * 5, radius=14)
    
    headers = ["FINANCIAL ITEM", "MANILA SPOILAGE", "AWITEN-PAY RESCUE", "PERFORMANCE DELTA"]
    col_xs = [table_x + 36, table_x + 560, table_x + 980, table_x + 1420]
    
    draw.rounded_rectangle([table_x, table_y, table_x + table_w, table_y + row_h], radius=14, fill=(20, 30, 55))
    for h, x in zip(headers, col_xs):
        draw.text((x, table_y + 26), h, font=F_BOLD_16, fill=TEXT_MUTED)
        
    rows = [
        ("Gross Produce Realized", "₱120,000 (₱15/kg)", "₱256,000 (₱32/kg / 25.60 XLM)", "+₱136,000", TEXT_WHITE, EMERALD_LIGHT),
        ("Driver Fuel & Toll Advance", "₱0 (Stranded)", "-₱6,500 (6.50 XLM)", "-₱6,500", TEXT_MUTED, TEXT_MUTED),
        ("x402 Oracle + 4.5% Platform Fee", "₱0", "-₱11,520 (2.15 XLM)", "-₱11,520", TEXT_MUTED, TEXT_MUTED),
        ("Net Co-op Payout Received", "₱120,000 (Total Loss)", "₱237,980 (23.80 XLM)", "+₱117,980 (+98.3%)", ROSE, EMERALD_LIGHT)
    ]
    
    for i, (item, manila, awiten, delta, col_m, col_d) in enumerate(rows):
        ry = table_y + (i + 1) * row_h
        if i == 3:
            draw.rounded_rectangle([table_x + 2, ry, table_x + table_w - 2, ry + row_h - 2], radius=10, fill=(12, 35, 30))
            
        draw.text((col_xs[0], ry + 24), item, font=F_BOLD_20 if i==3 else F_BOLD_18, fill=TEXT_WHITE)
        draw.text((col_xs[1], ry + 24), manila, font=F_BOLD_20 if i==3 else F_REG_18, fill=col_m)
        draw.text((col_xs[2], ry + 24), awiten, font=F_BOLD_20 if i==3 else F_REG_18, fill=EMERALD_LIGHT if i==3 else TEXT_WHITE)
        draw.text((col_xs[3], ry + 24), delta, font=F_BOLD_22 if i==3 else F_BOLD_18, fill=col_d)
        
        draw.line([(table_x, ry), (table_x + table_w, ry)], fill=PANEL_BORDER, width=1)
        
    strip_y = 660
    card_w = 540
    gap = 50
    card_h = 260
    
    econs = [
        ("4.5% Take-Rate", AMBER_LIGHT, "₱11,520 Clearing Take-Rate / 8-Ton Rescued Load",
         "Deducted programmatically at settlement from gross salvage off-take payout."),
        ("₱2,000 / Month", CYAN, "Pod Lease (₱1,500) + Console SaaS (₱500) per Truck",
         "Predictable recurring subscription revenue across cooperative hauling fleets."),
        ("1.56 Months", EMERALD_LIGHT, "Hardware Payback on ₱2,350 BOM (78.4% Annual Margin)",
         "Saving 15% of a single load (~₱45k) covers 22+ truck-months of subscription.")
    ]
    
    for i, (val, col, title, desc) in enumerate(econs):
        cx = table_x + i * (card_w + gap)
        draw_card(draw, cx, strip_y, card_w, card_h)
        draw.text((cx + 36, strip_y + 36), val, font=F_BLACK_56, fill=col)
        draw.text((cx + 36, strip_y + 120), title, font=F_BOLD_20, fill=TEXT_WHITE)
        draw.text((cx + 36, strip_y + 175), desc, font=F_REG_16, fill=TEXT_MUTED)
        
    draw_footer_banner(draw, "High Margin SaaS + Rescue Take-Rate: Saving 15% of 1 load (~₱45k) covers 22+ truck-months of subscription.")
    return img

# ==============================================================================
# SLIDE 10: Fundraise & Allocation
# ==============================================================================
def make_slide_10():
    img = create_base_canvas()
    draw = ImageDraw.Draw(img)
    draw_header(draw, "09 · Capital Allocation", "Scaling Autonomous Freight Liquidity", "Capital Deployment & Core Operational Guardrails", "FUNDRAISE ALLOCATION", 10)
    
    card_w = 405
    card_h = 440
    gap = 33
    start_x = 100
    card_y = 230
    
    allocs = [
        ("40%", EMERALD_LIGHT, "Hardware & Pods", "₱2,350 BOM pods + NFC dock terminals.", "FLEET ROLLOUT"),
        ("30%", CYAN, "Smart Contract & SDK", "Soroban escrow + Velo payment rails.", "ON-CHAIN INFRA"),
        ("20%", AMBER_LIGHT, "Off-Taker Network", "Bulacan & Tarlac processor floor contracts.", "BUYER LIQUIDITY"),
        ("10%", PURPLE, "Operations & IP", "Instrumented highway runs & IPOPHL patent.", "PATENT & LEGAL")
    ]
    
    for i, (pct, col, title, desc, tag) in enumerate(allocs):
        cx = start_x + i * (card_w + gap)
        draw_card(draw, cx, card_y, card_w, card_h)
        
        draw.text((cx + 32, card_y + 36), pct, font=F_BLACK_84, fill=col)
        draw.text((cx + 32, card_y + 165), title, font=F_BOLD_26, fill=TEXT_WHITE)
        draw_wrapped_text(draw, desc, cx + 32, card_y + 220, F_REG_22, CYAN, card_w - 64, line_spacing=8)
        
        draw.rounded_rectangle([cx + 32, card_y + card_h - 76, cx + 210, card_y + card_h - 40], radius=6, fill=(15, 25, 40), outline=col, width=1)
        draw.text((cx + 44, card_y + card_h - 66), tag, font=F_BOLD_14, fill=col)
            
    strip_y = 700
    strip_h = 220
    draw_card(draw, start_x, strip_y, WIDTH - 200, strip_h, fill=(12, 30, 25), outline=EMERALD)
    
    metrics = [
        ("100%", "AUTONOMOUS EXECUTION", "Zero human phone calls needed to divert"),
        ("0%", "USER GAS FEES", "Velo PayAccess sponsors all blockchain fees"),
        ("< 5 Min", "RESCUE LOCK TIME", "From heat spike detection to binding escrow"),
        ("+98.3%", "VALUE RECOVERED", "Net co-op payout increase vs Manila rot")
    ]
    
    m_w = (WIDTH - 200) // 4
    for i, (val, lbl, sub) in enumerate(metrics):
        mx = start_x + i * m_w
        if i > 0:
            draw.line([(mx, strip_y + 30), (mx, strip_y + strip_h - 30)], fill=PANEL_BORDER, width=1)
            
        draw.text((mx + 40, strip_y + 40), val, font=F_BLACK_56, fill=EMERALD_LIGHT)
        draw.text((mx + 40, strip_y + 125), lbl, font=F_BOLD_16, fill=TEXT_WHITE)
        draw.text((mx + 40, strip_y + 160), sub, font=F_REG_14, fill=TEXT_MUTED)
        
    draw_footer_banner(draw, "AWITEN-Pay: Replacing post-harvest collapse with autonomous financial certainty on Stellar.")
    return img

# ==============================================================================
# MAIN EXECUTION: Render & Save Multi-Page PDF
# ==============================================================================
def main():
    print("Generating Slide 1...")
    s1 = make_slide_1()
    print("Generating Slide 2...")
    s2 = make_slide_2()
    print("Generating Slide 3...")
    s3 = make_slide_3()
    print("Generating Slide 4...")
    s4 = make_slide_4()
    print("Generating Slide 5...")
    s5 = make_slide_5()
    print("Generating Slide 6...")
    s6 = make_slide_6()
    print("Generating Slide 7...")
    s7 = make_slide_7()
    print("Generating Slide 8...")
    s8 = make_slide_8()
    print("Generating Slide 9...")
    s9 = make_slide_9()
    print("Generating Slide 10...")
    s10 = make_slide_10()
    
    slides = [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10]
    
    out_dir_1 = "30_Deliverables/awiten-pay/apps/web"
    out_dir_2 = "/Users/kylexavier/.gemini/antigravity/scratch/awiten-pay/apps/web"
    
    os.makedirs(out_dir_1, exist_ok=True)
    os.makedirs(out_dir_2, exist_ok=True)
    
    pdf_path_1 = os.path.join(out_dir_1, "AWITEN-Pay-Pitch-Deck.pdf")
    pdf_path_2 = os.path.join(out_dir_2, "AWITEN-Pay-Pitch-Deck.pdf")
    
    print(f"Saving PDF to {pdf_path_1}...")
    s1.save(pdf_path_1, save_all=True, append_images=slides[1:], resolution=100.0)
    
    print(f"Copying PDF to {pdf_path_2}...")
    s1.save(pdf_path_2, save_all=True, append_images=slides[1:], resolution=100.0)
    
    print("Successfully built 10-slide 16:9 PDF!")

if __name__ == "__main__":
    main()
