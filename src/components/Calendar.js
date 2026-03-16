import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ScheduleModal from './ScheduleModal';
import '../App.css';

const Calendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [direction, setDirection] = useState(0);
    const [schedules, setSchedules] = useState(() => {
        const saved = localStorage.getItem('calendar_schedules');
        return saved ? JSON.parse(saved) : [];
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDateStr, setSelectedDateStr] = useState('');
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [activeDateSchedules, setActiveDateSchedules] = useState([]);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const calendarWrapperRef = useRef(null);

    // 1. 반복 로직 (주, 월, 년 단위로 수정)
    const getDailySchedules = useCallback((dateStr) => {
        const targetDate = new Date(dateStr);
        targetDate.setHours(0, 0, 0, 0);

        return schedules.filter(s => {
            const startDate = new Date(s.date);
            startDate.setHours(0, 0, 0, 0);

            // 시작일보다 전이거나, 삭제된 날짜면 제외
            if (targetDate < startDate) return false;
            if (s.deletedDates?.includes(dateStr)) return false;

            // 반복 설정이 없으면 날짜가 정확히 일치해야 함
            if (!s.repeat || s.repeat === 'none') return s.date === dateStr;

            const count = parseInt(s.repeatCount) || 1; // 사용자가 설정한 반복 횟수

            // 1. 매주 반복 (weekly)
            if (s.repeat === 'weekly') {
                const diffTime = targetDate - startDate;
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                const weekIndex = diffDays / 7;
                // 7일 간격이고, 경과 주수가 반복 횟수보다 작아야 함
                return diffDays % 7 === 0 && weekIndex < count;
            }

            // 2. 매월 반복 (monthly)
            if (s.repeat === 'monthly') {
                // 연도와 월 차이를 계산하여 몇 번째 달인지 확인
                const monthDiff = (targetDate.getFullYear() - startDate.getFullYear()) * 12 + (targetDate.getMonth() - startDate.getMonth());
                // 일자가 같고, 경과 개월 수가 반복 횟수보다 작아야 함
                return targetDate.getDate() === startDate.getDate() && monthDiff >= 0 && monthDiff < count;
            }

            // 3. 매년 반복 (yearly)
            if (s.repeat === 'yearly') {
                const yearDiff = targetDate.getFullYear() - startDate.getFullYear();
                // 월/일이 같고, 경과 연수가 반복 횟수보다 작아야 함
                return targetDate.getMonth() === startDate.getMonth() &&
                    targetDate.getDate() === startDate.getDate() &&
                    yearDiff >= 0 && yearDiff < count;
            }

            return s.date === dateStr;
        }).sort((a, b) => a.startTime.localeCompare(b.startTime));
    }, [schedules]);

    // 삭제 로직 추가 (에러 해결 핵심)
    const handleDelete = (id, deleteType) => {
        let next;
        if (deleteType === 'all') {
            // 모든 일정 삭제
            next = schedules.filter(s => s.id !== id);
        } else {
            // 해당 날짜만 삭제
            next = schedules.map(s =>
                s.id === id
                    ? { ...s, deletedDates: [...(s.deletedDates || []), selectedDateStr] }
                    : s
            );
        }
        setSchedules(next);
        localStorage.setItem('calendar_schedules', JSON.stringify(next));
        setIsModalOpen(false);
    };

    // 휠 스크롤 월 이동
    useEffect(() => {
        const handleWheel = (e) => {
            if (isModalOpen) return;
            e.preventDefault();
            if (e.deltaY > 0) {
                setDirection(1);
                setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
            } else {
                setDirection(-1);
                setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
            }
        };
        const wrapper = calendarWrapperRef.current;
        if (wrapper) wrapper.addEventListener('wheel', handleWheel, { passive: false });
        return () => { if (wrapper) wrapper.removeEventListener('wheel', handleWheel); };
    }, [isModalOpen]);

    // 날짜 클릭 핸들러
    const handleDateClick = (dStr) => {
        setSelectedDateStr(dStr);
        const daily = getDailySchedules(dStr);
        setActiveDateSchedules(daily);

        if (window.innerWidth > 768) {
            setSelectedSchedule(null);
            setIsModalOpen(true);
        }
    };

    // 알림 권한 및 타이머 로직 (기존 useEffect 아래에 추가)
// 알림 체크를 위한 별도의 useEffect
    useEffect(() => {
        if (Notification.permission === "default") {
            Notification.requestPermission();
        }

        const timer = setInterval(() => {
            const now = new Date();
            const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const currentTotalMin = now.getHours() * 60 + now.getMinutes();

            schedules.forEach(s => {
                // 변수명을 s.reminderTime으로 수정했습니다!
                if (s.date === nowStr && s.reminderTime && s.reminderTime !== "none") {
                    const [h, m] = s.startTime.split(':').map(Number);
                    const scheduleTotalMin = h * 60 + m;
                    const targetAlertMin = parseInt(s.reminderTime);

                    // 설정한 시간과 현재 시간이 일치하면 알림
                    if (scheduleTotalMin - targetAlertMin === currentTotalMin) {
                        new Notification("📅 일정 알림", {
                            body: `[${s.title}] 시작 ${targetAlertMin === 0 ? '정각' : targetAlertMin + '분 전'}입니다!`,
                            icon: "/favicon.ico"
                        });
                    }
                }
            });
        }, 60000); // 1분 주기

        return () => clearInterval(timer);
    }, [schedules]);

    // 달력 날짜 계산 로직
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    const days = [];
    for (let i = firstDay - 1; i >= 0; i--) days.push({ day: prevMonthLastDate - i, month: month - 1, year, currentMonth: false });
    for (let i = 1; i <= lastDate; i++) days.push({ day: i, month, year, currentMonth: true });
    while (days.length % 7 !== 0) days.push({ day: days.length - (firstDay + lastDate) + 1, month: month + 1, year, currentMonth: false });

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

    const variants = {
        enter: (dir) => ({ x: dir > 0 ? 100 : -100, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir) => ({ x: dir > 0 ? -100 : 100, opacity: 0 })
    };

    return (
        <div className="calendar-outer-wrapper" ref={calendarWrapperRef}>
            <div className="calendar-header">
                <button onClick={() => { setDirection(-1); setCurrentDate(new Date(year, month - 1, 1)); }}>&lt;</button>
                <h2>{year}년 {month + 1}월</h2>
                <button onClick={() => { setDirection(1); setCurrentDate(new Date(year, month + 1, 1)); }}>&gt;</button>
            </div>

            <div className="calendar-body">
                <div className="day-names-row">
                    {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                        <div key={d} className={`day-name ${i === 0 ? 'sunday' : i === 6 ? 'saturday' : ''}`}>{d}</div>
                    ))}
                </div>
                <div style={{ position: 'relative', overflow: 'hidden' }}>
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={`${year}-${month}`}
                            custom={direction}
                            variants={variants}
                            initial="enter" animate="center" exit="exit"
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="calendar-grid"
                        >
                            {weeks.map((week, wIdx) => (
                                <div key={wIdx} className="calendar-row">
                                    {week.map((item, dIdx) => {
                                        const dStr = `${item.year}-${String(item.month + 1).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`;
                                        const daily = getDailySchedules(dStr);
                                        const isToday = dStr === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
                                        const isSelected = selectedDateStr === dStr;

                                        return (
                                            <div
                                                key={dIdx}
                                                className={`calendar-day ${!item.currentMonth ? 'other' : ''} ${isToday ? 'today-cell' : ''} ${isSelected ? 'selected-day' : ''}`}
                                                onClick={() => handleDateClick(dStr)}
                                            >
                                                <span className="day-num">{item.day}</span>
                                                {daily.length > 0 && <div className="event-dot"></div>}
                                                <div className="sch-list">
                                                    {daily.map(s => (
                                                        <div key={s.id} className="sch-item" style={{backgroundColor: s.color}}
                                                             onClick={(e) => { e.stopPropagation(); setSelectedSchedule(s); setIsModalOpen(true); }}>
                                                            <span className="sch-title">{s.title}</span>
                                                            <span className="sch-time">{s.startTime}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* 모바일 전용 하단 상세 리스트 영역 */}
            <div className="mobile-schedule-details">
                {selectedDateStr && (
                    <div className="details-header-wrapper">
                        <div className="details-header">
                            <strong>{selectedDateStr} 일정</strong>
                        </div>
                        {/* 보라색 + 아이콘 버튼: 우측 상단 배치 */}
                        <button className="mobile-add-icon-btn" onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSchedule(null);
                            setIsModalOpen(true);
                        }}>+</button>
                    </div>
                )}

                {activeDateSchedules.length > 0 ? (
                    activeDateSchedules.map(s => (
                        <div key={s.id} className="mobile-sch-card"
                             style={{ borderLeft: `4px solid ${s.color}` }}
                             onClick={() => {
                                 setSelectedSchedule(s);
                                 setIsModalOpen(true);
                             }}>
                            <div className="sch-info">
                                <span className="sch-title-main">{s.title}</span>
                                <span className="sch-time-sub">{s.startTime} ~ {s.endTime}</span>
                            </div>
                        </div>
                    ))
                ) : null}
            </div>

            <ScheduleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                existingSchedule={selectedSchedule}
                selectedDate={selectedDateStr}
                onSave={(data) => {
                    const next = selectedSchedule
                        ? schedules.map(sv => sv.id === selectedSchedule.id ? { ...data, id: sv.id } : sv)
                        : [...schedules, { ...data, id: Date.now() }];
                    setSchedules(next);
                    localStorage.setItem('calendar_schedules', JSON.stringify(next));
                    setIsModalOpen(false);
                }}
                onDelete={handleDelete} // onDelete 프롭 전달하여 에러 해결
            />

            {/* 모바일용 하단 보라색 FAB */}

        </div>
    );
};

export default Calendar;