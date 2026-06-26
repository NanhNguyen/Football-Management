import re

with open('frontend/app/quan-tri/components/RefereeTab.tsx', 'r') as f:
    content = f.read()

# Update `playerButton` and `benchPlayerBox` styles
content = content.replace("playerButton: (isPopoverOpen: boolean, isRedCarded: boolean) => ({",
                          "playerButton: (isPopoverOpen: boolean, isRedCarded: boolean) => ({\n    whiteSpace: 'nowrap',\n    overflow: 'hidden',\n    textOverflow: 'ellipsis',")
content = content.replace("benchPlayerBox: {",
                          "benchPlayerBox: {\n    whiteSpace: 'nowrap',\n    overflow: 'hidden',\n    textOverflow: 'ellipsis',")

# Update column overflow for Home/Away columns
content = content.replace("columnHomeAway: {",
                          "columnHomeAway: {\n    maxHeight: 'calc(100vh - 64px)',\n    overflowY: 'auto',")

# Helper function for Position Tag
pos_helper = """
  const getPositionTag = (pos: string) => {
    let bg = 'transparent';
    let color = '#fff';
    let label = 'N/A';
    if (!pos) return null;
    const p = pos.toUpperCase();
    if (p.includes('THỦ MÔN') || p === 'GK') { bg = 'rgba(139,92,246,0.2)'; color = '#a78bfa'; label = 'GK'; }
    else if (p.includes('HẬU VỆ') || p === 'DEF') { bg = 'rgba(59,130,246,0.2)'; color = '#60a5fa'; label = 'DEF'; }
    else if (p.includes('TIỀN VỆ') || p === 'MID') { bg = 'rgba(16,185,129,0.2)'; color = '#34d399'; label = 'MID'; }
    else if (p.includes('TIỀN ĐẠO') || p === 'FWD') { bg = 'rgba(239,68,68,0.2)'; color = '#f87171'; label = 'FWD'; }
    
    if (label === 'N/A') return null;
    
    return (
      <span style={{
        fontSize: '10px',
        fontWeight: 600,
        borderRadius: '4px',
        padding: '1px 6px',
        background: bg,
        color: color,
        marginLeft: '6px',
        flexShrink: 0
      }}>
        {label}
      </span>
    );
  };
"""

content = content.replace("const renderDesktopLineupImageStyle = (team: any, isHome: boolean) => {",
                          pos_helper + "\n  const renderDesktopLineupImageStyle = (team: any, isHome: boolean) => {")

# Modify player rendering for Starters
starter_player_regex = r'\{p\.soAo\} \{p\.ten\}'
starter_player_repl = r'#{p.soAo} {p.ten} {getPositionTag(p.viTri)}'
content = content.replace("#{p.soAo} {p.ten}", "#{p.soAo} {p.ten} {getPositionTag(p.viTri)}")

# Also make player button display: 'flex' with alignItems: 'center' to place tag nicely, maybe space-between? 
# Currently: display: 'flex', alignItems: 'center', justifyContent: 'center'
# We change it to flex-start or keep center but it might look messy. If 'center' is there, the tag will be in the middle. Let's keep it.
# Actually, the user wants: layout "[số áo] [tên đầy đủ] [tag vị trí]"

# Task 3: Swap buttons and add confirm dialog for "Thiết lập lại"
# Remove "NHẬP NHANH SỰ KIỆN (SAU TRẬN)" from bottom and add a new Primary one at the top of the actions.
# Let's find "MATCH CONTROL" row in `RefereeTab.tsx` and the custom events.
# We will just rewrite the `div` containing ROW 1, ROW 2, CUSTOM TEAM ACTIONS, POST MATCH QUICK ADD.

with open('frontend/app/quan-tri/components/RefereeTab.tsx', 'w') as f:
    f.write(content)
