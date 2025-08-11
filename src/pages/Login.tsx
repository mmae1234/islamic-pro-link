import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import AuthForm from "@/components/AuthForm";

const Login = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>(() => {
    return searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  });

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'signup') {
      setMode('signup');
      navigate('/signup');
    }
  }, [searchParams, navigate]);

  const toggleMode = () => {
    if (mode === 'login') {
      navigate('/signup');
    } else {
      setMode('login');
    }
  };

  return <AuthForm mode={mode} onToggleMode={toggleMode} />;
};

export default Login;