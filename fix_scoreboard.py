import re

with open('frontend/app/quan-tri/components/RefereeTab.tsx', 'r') as f:
    content = f.read()

# Define old block to replace
old_block = """                  {/* Scoreboard Teams Row (~20%) */}
                  <div style={{ ...desktopStyles.scoreboardTeamsRow, marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'flex-end', flex: 1 }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#d8e4ff' }}>
                        {selectedMatch.doiNha?.ma || selectedMatch.doiNha?.ten?.toUpperCase()}
                      </span>
                      <span style={{ width: '40px', height: '40px', display: 'flex', fontSize: '40px' }}>
                        <TeamLogo logo={selectedMatch.doiNha?.logo} teamName={selectedMatch.doiNha?.ten} />
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ fontSize: '52px', fontWeight: 800, color: selectedMatch.trangThai === 'KET_THUC' ? '#10d98a' : (selectedMatch.trangThai === 'DANG_DIEN_RA' ? 'transparent' : 'var(--color-text-heading, #0F172A)'), background: selectedMatch.trangThai === 'DANG_DIEN_RA' ? 'linear-gradient(135deg, #ef4444, #f43f5e)' : 'none', WebkitBackgroundClip: selectedMatch.trangThai === 'DANG_DIEN_RA' ? 'text' : 'border-box', WebkitTextFillColor: selectedMatch.trangThai === 'DANG_DIEN_RA' ? 'transparent' : 'inherit', letterSpacing: '-2px', padding: '0 16px', lineHeight: 1 }}>
                        {selectedMatch.tyNha} - {selectedMatch.tyKhach}
                      </div>
                      <div style={{ marginTop: '8px' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', color: '#fff', background: selectedMatch.trangThai === 'DANG_DIEN_RA' ? 'linear-gradient(135deg, #ef4444, #f43f5e)' : (selectedMatch.trangThai === 'KET_THUC' ? 'var(--color-success, #10b981)' : '#64748b') }}>
                          {selectedMatch.trangThai === 'DANG_DIEN_RA' ? 'LIVE' : (selectedMatch.trangThai === 'KET_THUC' ? 'FT' : 'PRE-MATCH')}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'flex-start', flex: 1 }}>
                      <span style={{ width: '40px', height: '40px', display: 'flex', fontSize: '40px' }}>
                        <TeamLogo logo={selectedMatch.doiKhach?.logo} teamName={selectedMatch.doiKhach?.ten} />
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#d8e4ff' }}>
                        {selectedMatch.doiKhach?.ma || selectedMatch.doiKhach?.ten?.toUpperCase()}
                      </span>
                    </div>
                  </div>"""

new_block = """                  {/* Scoreboard Teams Row (~20%) */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '24px', width: '100%' }}>
                    {/* Main Row */}
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', width: '100%' }}>
                      
                      {/* Logo + Tên (Nhà) */}
                      <span style={{ width: '40px', height: '40px', display: 'flex', fontSize: '40px', flexShrink: 0 }}>
                        <TeamLogo logo={selectedMatch.doiNha?.logo} teamName={selectedMatch.doiNha?.ten} />
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 600, maxWidth: '120px', textAlign: 'center', color: '#d8e4ff', margin: '0 16px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedMatch.doiNha?.ma || selectedMatch.doiNha?.ten?.toUpperCase()}
                      </span>

                      {/* Tỉ số */}
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: '52px', fontWeight: 800, color: selectedMatch.trangThai === 'KET_THUC' ? '#10d98a' : (selectedMatch.trangThai === 'DANG_DIEN_RA' ? 'transparent' : 'var(--color-text-heading, #0F172A)'), background: selectedMatch.trangThai === 'DANG_DIEN_RA' ? 'linear-gradient(135deg, #ef4444, #f43f5e)' : 'none', WebkitBackgroundClip: selectedMatch.trangThai === 'DANG_DIEN_RA' ? 'text' : 'border-box', WebkitTextFillColor: selectedMatch.trangThai === 'DANG_DIEN_RA' ? 'transparent' : 'inherit', lineHeight: 1 }}>
                          {selectedMatch.tyNha}
                        </span>
                        
                        <span style={{ fontSize: '28px', color: 'rgba(255,255,255,0.3)', margin: '0 12px' }}>–</span>
                        
                        <span style={{ fontSize: '52px', fontWeight: 800, color: selectedMatch.trangThai === 'KET_THUC' ? '#10d98a' : (selectedMatch.trangThai === 'DANG_DIEN_RA' ? 'transparent' : 'var(--color-text-heading, #0F172A)'), background: selectedMatch.trangThai === 'DANG_DIEN_RA' ? 'linear-gradient(135deg, #ef4444, #f43f5e)' : 'none', WebkitBackgroundClip: selectedMatch.trangThai === 'DANG_DIEN_RA' ? 'text' : 'border-box', WebkitTextFillColor: selectedMatch.trangThai === 'DANG_DIEN_RA' ? 'transparent' : 'inherit', lineHeight: 1 }}>
                          {selectedMatch.tyKhach}
                        </span>
                      </div>

                      {/* Tên + Logo (Khách) */}
                      <span style={{ fontSize: '13px', fontWeight: 600, maxWidth: '120px', textAlign: 'center', color: '#d8e4ff', margin: '0 16px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedMatch.doiKhach?.ma || selectedMatch.doiKhach?.ten?.toUpperCase()}
                      </span>
                      <span style={{ width: '40px', height: '40px', display: 'flex', fontSize: '40px', flexShrink: 0 }}>
                        <TeamLogo logo={selectedMatch.doiKhach?.logo} teamName={selectedMatch.doiKhach?.ten} />
                      </span>
                    </div>

                    {/* Badge */}
                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', color: '#fff', background: selectedMatch.trangThai === 'DANG_DIEN_RA' ? 'linear-gradient(135deg, #ef4444, #f43f5e)' : (selectedMatch.trangThai === 'KET_THUC' ? 'var(--color-success, #10b981)' : '#64748b') }}>
                      {selectedMatch.trangThai === 'DANG_DIEN_RA' ? 'LIVE' : (selectedMatch.trangThai === 'KET_THUC' ? 'FT' : 'PRE-MATCH')}
                    </span>
                  </div>"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open('frontend/app/quan-tri/components/RefereeTab.tsx', 'w') as f:
        f.write(content)
    print("Success replacing scoreboard")
else:
    print("Block not found!")
