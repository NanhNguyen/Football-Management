import re

with open('frontend/app/quan-tri/components/RefereeTab.tsx', 'r') as f:
    content = f.read()

# 1. Update playerButton style
playerButton_old = """  playerButton: (isPopoverOpen: boolean, isRedCarded: boolean) => ({
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',"""
playerButton_new = """  playerButton: (isPopoverOpen: boolean, isRedCarded: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    whiteSpace: 'nowrap',"""
content = content.replace(playerButton_old, playerButton_new)

# 2. Update benchPlayerBox style
benchPlayerBox_old = """  benchPlayerBox: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',"""
benchPlayerBox_new = """  benchPlayerBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    whiteSpace: 'nowrap',"""
content = content.replace(benchPlayerBox_old, benchPlayerBox_new)

# 3. Increase left/right column width to 30%, middle to 40%
grid_old = "gridTemplateColumns: '28fr 44fr 28fr',"
grid_new = "gridTemplateColumns: '30fr 40fr 30fr',"
content = content.replace(grid_old, grid_new)

# 4. Update getPositionTag helper
# padding: 2px 6px, flexShrink: 0
posTag_old = """        padding: '1px 6px',
        background: bg,
        color: color,
        marginLeft: '6px',
        flexShrink: 0"""
posTag_new = """        padding: '2px 6px',
        background: bg,
        color: color,
        marginLeft: 'auto',
        minWidth: 'fit-content',
        flexShrink: 0"""
content = content.replace(posTag_old, posTag_new)

# 5. Fix player render blocks
# For starters
starter_btn_old = "                    #{p.soAo} {p.ten} {getPositionTag(p.viTri)}\n                  </button>"
starter_btn_new = """                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', minWidth: '28px', textAlign: 'left' }}>#{p.soAo}</span>
                    <span style={{ fontSize: '12.5px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left' }}>{p.ten}</span>
                    {getPositionTag(p.viTri)}
                  </button>"""
content = content.replace(starter_btn_old, starter_btn_new)

# For bench
bench_btn_old = "                    #{p.soAo} {p.ten} {getPositionTag(p.viTri)}\n                  </div>"
bench_btn_new = """                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', minWidth: '28px', textAlign: 'left' }}>#{p.soAo}</span>
                    <span style={{ fontSize: '12.5px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left' }}>{p.ten}</span>
                    {getPositionTag(p.viTri)}
                  </div>"""
content = content.replace(bench_btn_old, bench_btn_new)

with open('frontend/app/quan-tri/components/RefereeTab.tsx', 'w') as f:
    f.write(content)
