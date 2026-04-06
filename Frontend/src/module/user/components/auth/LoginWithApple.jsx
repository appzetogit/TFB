import React from 'react';
import AppleLogin from 'react-apple-login';

const LoginWithApple = ({ clientId, redirectURI, isLoading }) => {
  if (!clientId || !redirectURI) return null;

  return (
    <div className="apple-login-container" style={{ opacity: isLoading ? 0.6 : 1, pointerEvents: isLoading ? 'none' : 'auto' }}>
      <AppleLogin
        clientId={"com.tifunbox.web"}
        redirectURI={"https://app.tifunbox.com/api/auth/apple/callback"}
        responseType="code"
        responseMode="form_post" // Matching backend expectation
        usePopup={false} // Keeping popup to avoid breaking postMessage logic
        designProp={{
          height: 30,
          width: 140,
          color: "black",
          border: false,
          type: "sign-in",
          border_radius: 15,
          scale: 1,
          locale: "en_US",
        }}
      />
    </div>
  );
};

export default LoginWithApple;
