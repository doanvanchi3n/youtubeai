"""
Sentiment Analysis Keywords
Tập hợp các từ khóa được sử dụng để phân tích sentiment và emotion
"""

# Rule-based keyword sets (normalized)
POSITIVE_KEYWORDS = [
    "hay", "qua hay", "rat hay", "tuyet", "qua tuyet",
    "ung ho", "cam on", "cám ơn", "thank", "thanks",
    "love", "yeu", "thich", "rat thich", "good", "great", "dang cap",
    "thank you", "hay qua", "tiep tuc", "ung ho ong",
    "nang suat", "năng suất", "chuan qua", "bao luon",
    "qua that", "qua xuat sac", "qua dep", "qua tuyet voi",
    "ung ho he", "tiep tuc nha", "hay lam", "qua ok",
    "chia se hay", "video chat luong", "qua man nhan",
    "❤", "💙", "💚", "💛", "💜", "💖", "💗", "💞",
    "heart", "loveeee", "đỉnh", "đỉnh cao", "cu te", "cute",
    "tam huyet", "tâm huyết", "xin xo", "xịn xò", "noice", "noiceee", "awesome",
    "thanks ad", "cam on ad", "respect", "gain", "thich vl",
    "hay vl", "hay vcl", "video chất", "hay vãi", "hay thật sự",
    "co tam", "có tâm", "may man", "may mắn", "cuon", "cuốn",
    "chat luong", "chất lượng", "thoa man", "thỏa mãn", "yeu thich", "yêu thích",
    "phan tich ro", "phân tích rõ", "giai thich", "giải thích", "khi can", "kỹ càng"
]

HAPPY_KEYWORDS = [
    "hong", "mong cho", "hao huc", "vui", "phan khoi",
    "cho doi", "thich qua", "he he", "hihi", "hehe",
    "hap dan", "hype", "phat nghien", "cuong qua",
    "vui qua", "cuoi te ghe", "like manh", "dang mong",
    "mong clip", "mong video", "hnhk", "trong ngong",
    "hóng clip", "hóng lắm", "XD", "xD", "haha", "lol",
    "amazing", "so good", "comeback", "yay", "tuyet voi qua",
    "ok la", "yeu qua", "kich thich", "khong chiu noi"
]

SUGGESTION_KEYWORDS = [
    "gop y", "co the", "nen ", "nen them", "thu ", "thu xem",
    "toi noi that", "mong", "hy vong", "de nghi", "ban nen",
    "xin phep", "neu duoc", "có thể", "nen co", "hay them",
    "toi nghi", "toi de xuat", "neu ban", "ban thu",
    "sua lai", "xem lai", "noi that", "thuc su ne", "toi noi that",
    "recommend", "recommend", "de nghi", "nen thu", "hay thu",
    "suggest", "propose", "should", "can try", "co the thu"
]

NEGATIVE_KEYWORDS = [
    "te hai", "qua te", "qua toi", "qua tham", "qua tam te",
    "that vong", "qua tat vong", "dang so", "chan qua",
    "nham chan qua", "qua chan", "thua roi", "vo nghia",
    "phi tien", "khong ra gi", "vo dung", "doi tra",
    "thoi di", "chiu khong noi", "that vong thi", "kho chiu",
    "tieu cuc thi", "khong on chut nao", "qua nhat", "ban qua xau",
    "noi dung te", "te vcl", "te vcl", "bad", "worst", "fail"
]

ATTACK_KEYWORDS = [
    "ngu", "ngo", "dai", "dien", "khung", "oc cho", "oc lon",
    "dau bo", "nao ca vang", "kem coi", "that bai", "mat day",
    "vo hoc", "rac roi", "rac ruoi", "vo dung", "thang", "con",
    "xau xi", "kinh tom", "do bo", "cuot", "im di", "cot",
    "bien di", "deo", "dam", "chui", "mat day", "do nat",
    "coc can", "lay xe", "tao xu ly", "tao cho may biet tay",
    "ham ho", "cho du", "dau dat", "doan duong", "tham hai"
]

