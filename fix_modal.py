with open('frontend/app/quan-tri/components/RefereeTab.tsx', 'r') as f:
    content = f.read()

# Add state
state_str = "const [mounted, setMounted] = useState(false);"
new_state = state_str + "\n  const [resetConfirmMatchId, setResetConfirmMatchId] = useState<string | null>(null);"
content = content.replace(state_str, new_state)

# Replace window.confirm
old_btn = """                      <button
                        onClick={() => {
                          if (window.confirm("Bạn có chắc muốn thiết lập lại trận đấu này không?\\nHành động này không thể hoàn tác.")) {
                            handleResetMatch(selectedMatch.id);
                          }
                        }}"""
new_btn = """                      <button
                        onClick={() => setResetConfirmMatchId(selectedMatch.id)}"""
content = content.replace(old_btn, new_btn)

# Add Modal
modal_code = """
      {resetConfirmMatchId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--color-surface, #ffffff)', padding: '24px', borderRadius: '16px', maxWidth: '400px', width: '90%', textAlign: 'center', border: '1px solid var(--color-border-light, #f1f5f9)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-heading, #0F172A)', marginBottom: '12px' }}>THIẾT LẬP LẠI TRẬN ĐẤU</h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary, #475569)', marginBottom: '24px', lineHeight: 1.5 }}>Bạn có chắc muốn thiết lập lại trận đấu này không? Hành động này không thể hoàn tác.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setResetConfirmMatchId(null)}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border, #e2e8f0)', background: 'transparent', color: 'var(--color-text-muted, #94a3b8)', fontWeight: 600, cursor: 'pointer' }}
              >
                HỦY
              </button>
              <button 
                onClick={() => { handleResetMatch(resetConfirmMatchId); setResetConfirmMatchId(null); }}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                XÁC NHẬN
              </button>
            </div>
          </div>
        </div>
      )}
"""
content = content.replace("export default function RefereeTab({", "export default function RefereeTab({") # just to be safe
wrapper_end = "    <div className={`${styles.refereeConsoleWrapper} animate-fade-in`}>"
content = content.replace(wrapper_end, wrapper_end + modal_code)

with open('frontend/app/quan-tri/components/RefereeTab.tsx', 'w') as f:
    f.write(content)
