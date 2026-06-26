import re

with open('frontend/app/quan-tri/components/RefereeTab.tsx', 'r') as f:
    content = f.read()

# TASK 1: Replace Back button with Breadcrumb
back_btn_regex = r'\{\/\* Absolute back button \*\/\}\s*<button className="desktop-back-btn" style=\{desktopStyles\.backBtn\} onClick=\{[^}]+\}>\s*← Trở về\s*<\/button>'
breadcrumb = """{/* Breadcrumb Navigation */}
              <div style={{ position: 'absolute', top: '16px', left: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', zIndex: 10 }}>
                <a className="desktop-breadcrumb-parent" onClick={() => setSelectedMatchId(null)} style={{ color: 'rgba(255,255,255,0.35)', cursor: 'pointer', textDecoration: 'none', transition: 'all 0.2s' }}>Lịch đấu</a>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>›</span>
                <a className="desktop-breadcrumb-parent" onClick={() => setSelectedMatchId(null)} style={{ color: 'rgba(255,255,255,0.35)', cursor: 'pointer', textDecoration: 'none', transition: 'all 0.2s' }}>{selectedMatch.vong}</a>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>›</span>
                <span style={{ color: 'rgba(255,255,255,0.85)', cursor: 'default' }}>{selectedMatch.doiNha?.ma || selectedMatch.doiNha?.ten?.substring(0, 3).toUpperCase()} vs {selectedMatch.doiKhach?.ma || selectedMatch.doiKhach?.ten?.substring(0, 3).toUpperCase()}</span>
              </div>"""

content = re.sub(back_btn_regex, breadcrumb, content)

style_insertion = r'(\.desktop-back-btn:hover \{\s*color: var\(--color-text-heading, #0F172A\) !important;\s*\})'
breadcrumb_style = r"""\1
          .desktop-breadcrumb-parent:hover {
            color: rgba(255,255,255,0.65) !important;
            text-decoration: underline !important;
          }"""
content = re.sub(style_insertion, breadcrumb_style, content)


# TASK 2: 3-column layout
# From: gridTemplateColumns: 'repeat(12, 1fr)',
# To: gridTemplateColumns: '28fr 44fr 28fr',
content = content.replace("gridTemplateColumns: 'repeat(12, 1fr)',", "gridTemplateColumns: '28fr 44fr 28fr',")

# For columnHomeAway (which was span 3) and columnCenter (which was span 6), 
# now with 28/44/28 we just change the span or remove it because 1fr does the job if we use grid, wait if we just change grid-template-columns, the children will span 1 track by default.
# But they currently have gridColumn: 'span 3', we should remove that or change it.
content = content.replace("gridColumn: 'span 3',", "")
content = content.replace("gridColumn: 'span 6',", "")

with open('frontend/app/quan-tri/components/RefereeTab.tsx', 'w') as f:
    f.write(content)
