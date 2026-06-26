with open('frontend/app/quan-tri/components/RefereeTab.tsx', 'r') as f:
    content = f.read()

with open('center_col_new.tsx', 'r') as f:
    new_center = f.read()

start_marker = "{/* CENTER COLUMN: BẢNG ĐIỀU KHIỂN & NHẬT KÝ */}"
end_marker = "{/* RIGHT COLUMN: AWAY TEAM */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + new_center + content[end_idx:]
    with open('frontend/app/quan-tri/components/RefereeTab.tsx', 'w') as f:
        f.write(new_content)
    print("Success")
else:
    print("Markers not found")
