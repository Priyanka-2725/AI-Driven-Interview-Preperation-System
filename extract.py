import json
with open(r'C:\Users\HP\.gemini\antigravity-ide\brain\e27868d7-3d1b-4673-8ad3-24baebdf336e\.system_generated\logs\transcript_full.jsonl', 'r', encoding='utf-8') as f:
    text = json.loads(f.readline())['content']
with open(r'd:\AI-INTERVIEW-COACH\prompt.txt', 'w', encoding='utf-8') as out:
    out.write(text)
