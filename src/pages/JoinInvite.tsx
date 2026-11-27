import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";

/** /join/<code>: remember who invited this visitor, then go to sign-up. */
const JoinInvite = () => {
  const { code } = useParams();
  useEffect(() => {
    if (code && /^[a-z0-9]{4,32}$/i.test(code)) {
      try {
        localStorage.setItem("pending_invite", code.toLowerCase());
      } catch {
        /* storage unavailable */
      }
    }
  }, [code]);
  return <Navigate to="/signup?src=invite" replace />;
};

export default JoinInvite;
