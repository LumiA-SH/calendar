import React, { useState, useEffect } from 'react';

const ScheduleModal = ({ isOpen, onClose, onSave, onDelete, selectedDate, existingSchedule }) => {
    const [title, setTitle] = useState('');
    const [startHour, setStartHour] = useState('09');
    const [startMin, setStartMin] = useState('00');
    const [endHour, setEndHour] = useState('10');
    const [endMin, setEndMin] = useState('00');
    const [color, setColor] = useState('#8b5cf6');
    const [description, setDescription] = useState('');
    const [repeat, setRepeat] = useState('none');
    const [repeatCount, setRepeatCount] = useState(1);
    const [reminderTime, setReminderTime] = useState('10');

    useEffect(() => {
        if (existingSchedule) {
            setTitle(existingSchedule.title);
            const [sh, sm] = existingSchedule.startTime.split(':');
            const [eh, em] = existingSchedule.endTime.split(':');
            setStartHour(sh); setStartMin(sm);
            setEndHour(eh); setEndMin(em);
            setColor(existingSchedule.color);
            setDescription(existingSchedule.description || '');
            setRepeat(existingSchedule.repeat || 'none');
            setRepeatCount(existingSchedule.repeatCount || 1);
            setReminderTime(existingSchedule.reminderTime || '10');
        } else {
            setTitle(''); setStartHour('09'); setStartMin('00'); setEndHour('10'); setEndMin('00');
            setColor('#8b5cf6'); setDescription(''); setRepeat('none'); setRepeatCount(1); setReminderTime('10');
        }
    }, [existingSchedule, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave({
            id: existingSchedule?.id || Date.now(),
            date: selectedDate,
            title: title || '제목 없음',
            startTime: `${startHour}:${startMin}`,
            endTime: `${endHour}:${endMin}`,
            color,
            description,
            repeat,
            repeatCount: parseInt(repeatCount) || 1,
            reminderTime
        });
    };

    const handleDelete = () => {
        if (repeat !== 'none') {
            if (window.confirm("이후의 모든 반복 일정을 함께 삭제하시겠습니까? 취소를 누르면 이 일정만 삭제됩니다.")) {
                onDelete(existingSchedule.id, 'all');
            } else {
                onDelete(existingSchedule.id, 'one');
            }
        } else {
            onDelete(existingSchedule.id, 'all');
        }
    };

    const hourOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    const minuteOptions = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                {/* 제목 */}
                <input className="modal-title-input" placeholder="제목 추가" value={title} onChange={e => setTitle(e.target.value)} />

                {/* 시간 선택 (기본 박스) */}
                <div className="time-select-container">
                    <div className="time-row">
                        <span className="time-label">시작</span>
                        <div className="picker-group-equal">
                            <select className="equal-select" value={startHour} onChange={e => setStartHour(e.target.value)}>
                                {hourOptions.map(h => <option key={h} value={h}>{h}시</option>)}
                            </select>
                            <select className="equal-select" value={startMin} onChange={e => setStartMin(e.target.value)}>
                                {minuteOptions.map(m => <option key={m} value={m}>{m}분</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="time-row">
                        <span className="time-label">종료</span>
                        <div className="picker-group-equal">
                            <select className="equal-select" value={endHour} onChange={e => setEndHour(e.target.value)}>
                                {hourOptions.map(h => <option key={h} value={h}>{h}시</option>)}
                            </select>
                            <select className="equal-select" value={endMin} onChange={e => setEndMin(e.target.value)}>
                                {minuteOptions.map(m => <option key={m} value={m}>{m}분</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* 알림 설정 (반복 설정과 레이아웃 완전 통일) */}
                <div className="time-row">
                    <span className="time-label">알림</span>
                    <div className="picker-group-equal">
                        <select className="equal-select" style={{ flex: 1 }} value={reminderTime} onChange={e => setReminderTime(e.target.value)}>
                            <option value="0">정시</option>
                            <option value="5">5분전</option>
                            <option value="10">10분 전</option>
                            <option value="30">30분 전</option>
                            <option value="60">1시간 전</option>
                        </select>
                    </div>
                </div>

                {/* 반복 설정 */}
                <div className="time-row">
                    <span className="time-label">반복</span>
                    <div className="picker-group-equal">
                        <select className="equal-select" value={repeat} onChange={e => setRepeat(e.target.value)} style={{ flex: 1.5 }}><option value="none">반복 없음</option>
                            <option value="weekly">매주</option>
                            <option value="monthly">매월</option>
                            <option value="yearly">매년</option>
                        </select>
                        {repeat !== 'none' && (
                            <div style={{ display: 'flex', alignItems: 'center', flex: 1, marginLeft: '10px' }}>
                                <input
                                    type="number"
                                    className="equal-select"
                                    style={{ width: '100%', textAlign: 'center' }}
                                    value={repeatCount}
                                    onChange={e => setRepeatCount(e.target.value)}
                                    min="1"
                                />
                                <span className="time-label" style={{ width: 'auto', marginLeft: '5px' }}>회</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 색상 선택 */}
                <div className="color-picker-row" style={{ display: 'flex', justifyContent: 'center', margin: '20px 0', gap: '15px' }}>
                    {['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'].map(c => (
                        <div key={c} className={`color-dot ${color === c ? 'active' : ''}`} style={{ backgroundColor: c, width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', border: color === c ? '2.5px solid #444' : 'none' }} onClick={() => setColor(c)} />
                    ))}
                </div>

                {/* 설명창 (회색 둥근 사각형 박스) */}
                <div style={{ marginTop: '5px' }}>
                    <textarea
                        className="modal-textarea"
                        style={{
                            width: '100%',
                            height: '100px',
                            padding: '12px',
                            borderRadius: '12px',
                            border: '1px solid #e5e7eb',
                            backgroundColor: '#f9fafb',
                            fontSize: '16px',
                            fontFamily: 'inherit',
                            resize: 'none',
                            boxSizing: 'border-box'
                        }}
                        placeholder="설명 추가"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    />
                </div>

                {/* 하단 버튼 */}
                <div className="modal-buttons">
                    <div className="left-btns">
                        <button className="btn cancel-btn" onClick={onClose}>취소</button>
                        {existingSchedule && <button className="btn delete-btn" onClick={handleDelete}>삭제</button>}
                    </div>
                    <button className="btn save-btn" onClick={handleSave}>저장</button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleModal;