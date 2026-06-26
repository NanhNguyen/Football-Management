with open('frontend/app/quan-tri/components/RefereeTab.tsx', 'r') as f:
    content = f.read()

old_str = "color: selectedMatch.trangThai === 'KET_THUC' ? '#10d98a' : (selectedMatch.trangThai === 'DANG_DIEN_RA' ? '#EF4444' : 'var(--color-text-heading, #0F172A)'), letterSpacing: '-2px', padding: '0 16px', lineHeight: 1"
new_str = "color: selectedMatch.trangThai === 'KET_THUC' ? '#10d98a' : (selectedMatch.trangThai === 'DANG_DIEN_RA' ? 'transparent' : 'var(--color-text-heading, #0F172A)'), background: selectedMatch.trangThai === 'DANG_DIEN_RA' ? 'linear-gradient(135deg, #ef4444, #f43f5e)' : 'none', WebkitBackgroundClip: selectedMatch.trangThai === 'DANG_DIEN_RA' ? 'text' : 'border-box', WebkitTextFillColor: selectedMatch.trangThai === 'DANG_DIEN_RA' ? 'transparent' : 'inherit', letterSpacing: '-2px', padding: '0 16px', lineHeight: 1"

content = content.replace(old_str, new_str)

with open('frontend/app/quan-tri/components/RefereeTab.tsx', 'w') as f:
    f.write(content)
