import React from 'react';
import Calendar from './Calendar'; // 달력 컴포넌트 불러오기

const Main = () => {
    return (
        <main className="main-content">
            <Calendar /> {/* 빈 껍데기 대신 진짜 달력 렌더링 */}
        </main>
    );
};

export default Main;