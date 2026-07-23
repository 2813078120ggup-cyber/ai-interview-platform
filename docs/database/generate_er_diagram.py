from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


WIDTH, HEIGHT = 3600, 2400
BG = "#F7F9FC"
INK = "#172033"
MUTED = "#526077"
LINE = "#708097"
CARD = "#FFFFFF"
BORDER = "#BCC7D6"

FONT_PATH = Path(r"C:\Windows\Fonts\msyh.ttc")
FONT_BOLD_PATH = Path(r"C:\Windows\Fonts\msyhbd.ttc")


def font(size, bold=False):
    path = FONT_BOLD_PATH if bold and FONT_BOLD_PATH.exists() else FONT_PATH
    return ImageFont.truetype(str(path), size)


TITLE_FONT = font(60, True)
SUBTITLE_FONT = font(29)
ENTITY_FONT = font(32, True)
FIELD_FONT = font(23)
FIELD_BOLD_FONT = font(23, True)
EDGE_FONT = font(21, True)
LEGEND_FONT = font(23)


image = Image.new("RGB", (WIDTH, HEIGHT), BG)
draw = ImageDraw.Draw(image)


nodes = {
    "role": (80, 160, 570, 500),
    "user": (80, 660, 570, 1360),
    "user_role": (760, 180, 1320, 650),
    "question_bank": (1480, 150, 2070, 690),
    "question": (1460, 820, 2100, 1530),
    "interview": (730, 1280, 1340, 2140),
    "interview_question": (2260, 700, 2910, 1400),
    "answer": (2980, 170, 3540, 720),
    "evaluation": (2990, 900, 3550, 1690),
    "report": (2220, 1700, 2910, 2300),
}

edge_labels = []


def anchor(name, side, offset=0.5):
    x1, y1, x2, y2 = nodes[name]
    if side == "left":
        return (x1, int(y1 + (y2 - y1) * offset))
    if side == "right":
        return (x2, int(y1 + (y2 - y1) * offset))
    if side == "top":
        return (int(x1 + (x2 - x1) * offset), y1)
    return (int(x1 + (x2 - x1) * offset), y2)


def relation(points, label, label_xy, color=LINE):
    draw.line(points, fill=color, width=5, joint="curve")
    for px, py in (points[0], points[-1]):
        draw.ellipse((px - 7, py - 7, px + 7, py + 7), fill=BG, outline=color, width=4)
    edge_labels.append((label, label_xy, color))


def draw_edge_label(label, label_xy, color):
    box = draw.textbbox((0, 0), label, font=EDGE_FONT)
    bw, bh = box[2] - box[0] + 28, box[3] - box[1] + 18
    lx, ly = label_xy
    draw.rounded_rectangle((lx - bw // 2, ly - bh // 2, lx + bw // 2, ly + bh // 2), 8, fill=BG, outline=color, width=2)
    draw.text((lx, ly - 1), label, font=EDGE_FONT, fill=INK, anchor="mm")


# Relationship layer. Labels explicitly show relationship type and cardinality.
relation([anchor("role", "right", 0.45), (670, 313), (670, 350), anchor("user_role", "left", 0.36)], "分配角色  1 : N", (685, 270), "#2F855A")
relation([anchor("user", "right", 0.12), (690, 744), (690, 520), anchor("user_role", "left", 0.73)], "拥有角色  1 : N", (690, 705), "#2F855A")
relation([anchor("user", "top", 0.72), (490, 590), (1110, 590), anchor("user_role", "bottom", 0.63)], "执行分配  0..1 : N", (1080, 545), "#2F855A")

relation([anchor("user", "right", 0.36), (1180, 912), (1180, 430), anchor("question_bank", "left", 0.52)], "创建题库  1 : N", (1370, 430), "#2563A6")
relation([anchor("user", "right", 0.50), (1395, 1010), anchor("question", "left", 0.27)], "录入题目  1 : N", (1350, 1005), "#2563A6")
relation([anchor("question_bank", "bottom", 0.50), anchor("question", "top", 0.50)], "包含  1 : N", (1775, 755), "#2563A6")

relation([anchor("user", "bottom", 0.50), (325, 2200), (900, 2200), anchor("interview", "bottom", 0.28)], "参加面试  1 : N", (590, 2200), "#B7791F")
relation([anchor("user", "right", 0.71), (680, 1155), (680, 1510), anchor("interview", "left", 0.27)], "主持面试  1 : N", (680, 1395), "#B7791F")
relation([anchor("user", "right", 0.86), (700, 1260), (700, 1900), anchor("interview", "left", 0.72)], "创建面试  1 : N", (700, 1835), "#B7791F")

relation([anchor("question", "right", 0.42), (2170, 1118), anchor("interview_question", "left", 0.50)], "被选用  1 : N", (2180, 1070), "#5B6472")
relation([anchor("interview", "right", 0.23), (1820, 1478), (1820, 1320), (2190, 1320), anchor("interview_question", "left", 0.82)], "包含面试题  1 : N", (1900, 1320), "#5B6472")

relation([anchor("interview_question", "right", 0.18), (2950, 826), (2950, 610), anchor("answer", "left", 0.80)], "产生作答  1 : 0..1", (3035, 785), "#0F766E")
relation([anchor("interview_question", "right", 0.67), anchor("evaluation", "left", 0.35)], "接受评测  1 : N", (2950, 1165), "#A33A52")
relation([anchor("user", "bottom", 0.78), (520, 2260), (3320, 2260), (3320, 1740), anchor("evaluation", "bottom", 0.58)], "人工评分/确认  0..1 : N", (3160, 2260), "#A33A52")

relation([anchor("interview", "right", 0.76), (1800, 1935), (1800, 2000), anchor("report", "left", 0.50)], "生成报告  1 : 0..1", (1995, 2000), "#6B46A1")
relation([anchor("user", "bottom", 0.26), (225, 2340), (2550, 2340), anchor("report", "bottom", 0.48)], "编辑报告  0..1 : N", (2700, 2340), "#6B46A1")


def card(name, title, subtitle, fields, header_color):
    x1, y1, x2, y2 = nodes[name]
    draw.rounded_rectangle((x1, y1, x2, y2), 8, fill=CARD, outline=BORDER, width=3)
    draw.rounded_rectangle((x1, y1, x2, y1 + 92), 8, fill=header_color)
    draw.rectangle((x1, y1 + 75, x2, y1 + 92), fill=header_color)
    draw.text((x1 + 24, y1 + 34), title, font=ENTITY_FONT, fill="#FFFFFF", anchor="lm")
    draw.text((x2 - 22, y1 + 47), subtitle, font=FIELD_FONT, fill="#FFFFFF", anchor="rm")
    y = y1 + 118
    for marker, field_name, field_type in fields:
        if marker:
            marker_color = "#B42318" if "PK" in marker else "#2563A6"
            draw.rounded_rectangle((x1 + 20, y - 4, x1 + 88, y + 31), 7, fill=marker_color)
            draw.text((x1 + 54, y + 13), marker, font=font(18, True), fill="#FFFFFF", anchor="mm")
        draw.text((x1 + 104, y), field_name, font=FIELD_BOLD_FONT if marker else FIELD_FONT, fill=INK)
        draw.text((x2 - 20, y), field_type, font=FIELD_FONT, fill=MUTED, anchor="ra")
        y += 52


card("role", "角色", "role", [
    ("PK", "id", "BIGINT"), ("UK", "role_code", "VARCHAR"), ("UK", "role_name", "VARCHAR"), ("", "status", "TINYINT")
], "#2F855A")

card("user", "用户", "user", [
    ("PK", "id", "BIGINT"), ("UK", "username", "VARCHAR"), ("", "password_hash", "VARCHAR"),
    ("", "real_name", "VARCHAR"), ("UK", "email", "VARCHAR"), ("UK", "phone", "VARCHAR"),
    ("", "status", "TINYINT"), ("", "created_at", "DATETIME"), ("", "deleted_at", "DATETIME")
], "#2F855A")

card("user_role", "用户角色", "user_role", [
    ("PK/FK", "user_id", "BIGINT"), ("PK/FK", "role_id", "BIGINT"),
    ("FK", "assigned_by", "BIGINT"), ("", "assigned_at", "DATETIME")
], "#2F855A")

card("question_bank", "题库", "question_bank", [
    ("PK", "id", "BIGINT"), ("UK", "bank_code", "VARCHAR"), ("", "name", "VARCHAR"),
    ("", "visibility", "TINYINT"), ("", "status", "TINYINT"), ("FK", "created_by", "BIGINT"),
    ("", "created_at", "DATETIME")
], "#2563A6")

card("question", "题目", "question", [
    ("PK", "id", "BIGINT"), ("FK", "bank_id", "BIGINT"), ("", "question_type", "VARCHAR"),
    ("", "difficulty", "TINYINT"), ("", "content", "TEXT"), ("", "options", "JSON"),
    ("", "correct_answer", "JSON"), ("", "score", "DECIMAL"), ("FK", "created_by", "BIGINT"),
    ("", "status", "TINYINT")
], "#2563A6")

card("interview", "面试", "interview", [
    ("PK", "id", "BIGINT"), ("FK", "candidate_id", "BIGINT"), ("FK", "interviewer_id", "BIGINT"),
    ("", "scheduled_at", "DATETIME"), ("", "duration", "INT"), ("", "started_at", "DATETIME"),
    ("", "ended_at", "DATETIME"), ("", "type", "VARCHAR"), ("", "status", "TINYINT"),
    ("FK", "created_by", "BIGINT"), ("", "created_at", "DATETIME")
], "#B7791F")

card("interview_question", "面试题目", "interview_question", [
    ("PK", "id", "BIGINT"), ("FK", "interview_id", "BIGINT"), ("FK", "question_id", "BIGINT"),
    ("", "sequence_no", "INT"), ("", "max_score", "DECIMAL"), ("", "question_snapshot", "JSON"),
    ("", "created_at", "DATETIME")
], "#5B6472")

card("answer", "面试作答", "interview_answer", [
    ("PK", "id", "BIGINT"), ("FK/UK", "interview_question_id", "BIGINT"),
    ("", "answer_content", "TEXT"), ("", "answer_data", "JSON"),
    ("", "audio_url", "VARCHAR"), ("", "answered_at", "DATETIME")
], "#0F766E")

card("evaluation", "评测", "evaluation", [
    ("PK", "id", "BIGINT"), ("FK", "interview_question_id", "BIGINT"), ("FK", "evaluator_id", "BIGINT"),
    ("", "source", "VARCHAR"), ("", "professional_score", "DECIMAL"), ("", "expression_score", "DECIMAL"),
    ("", "logic_score", "DECIMAL"), ("", "adaptability_score", "DECIMAL"), ("", "overall_score", "DECIMAL"),
    ("FK", "confirmed_by", "BIGINT"), ("", "status", "TINYINT")
], "#A33A52")

card("report", "面试报告", "report", [
    ("PK", "id", "BIGINT"), ("FK/UK", "interview_id", "BIGINT"), ("", "total_score", "DECIMAL"),
    ("", "summary", "TEXT"), ("", "strengths", "TEXT"), ("", "weaknesses", "TEXT"),
    ("", "generation_method", "VARCHAR"), ("FK", "generated_by", "BIGINT"), ("", "pdf_url", "VARCHAR")
], "#6B46A1")


draw.text((80, 55), "模拟面试平台 ER 图", font=TITLE_FONT, fill=INK)
draw.text((80, 120), "实体、主外键、关系类型与基数", font=SUBTITLE_FONT, fill=MUTED)

legend_x = 2220
draw.rounded_rectangle((legend_x, 42, 3540, 125), 8, fill=CARD, outline=BORDER, width=2)
draw.text((legend_x + 24, 83), "基数：1 = 必须一个    0..1 = 零或一个    N = 多个    PK = 主键    FK = 外键    UK = 唯一键", font=LEGEND_FONT, fill=INK, anchor="lm")

for edge_label, edge_label_xy, edge_color in edge_labels:
    draw_edge_label(edge_label, edge_label_xy, edge_color)

output = Path(__file__).with_name("interview-platform-er.png")
image.save(output, format="PNG", optimize=True)
print(output)
