import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AuthForm from "@/components/AuthForm";

const Login = () => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup'>(() => {
    return searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  });

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'signup') {
      setMode('signup');
    }
  }, [searchParams]);

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
  };

  return <AuthForm mode={mode} onToggleMode={toggleMode} />;
};

export default Login;