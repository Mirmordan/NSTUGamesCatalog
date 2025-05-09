import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/authContext'; 
import AppRouter from './router'; 
import Header from './components/header/header';   


function App() {
  return (
    <AuthProvider> 
      <BrowserRouter> 
        <Header /> 
        
        <main className="app-content"> 
          <AppRouter /> 
        </main>
        
       
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;