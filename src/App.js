import React from 'react';
import './App.css'; // CSS 단일 파일 import
import Header from './components/Header';
import Main from './components/Main';
import Footer from './components/Footer';

function App() {
  return (
      <div className="app-container">
        <Header />
        <Main />
        <Footer />
      </div>
  );
}


export default App;