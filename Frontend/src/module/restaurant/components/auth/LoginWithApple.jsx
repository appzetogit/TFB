import React from 'react';
import AppleLogin from 'react-apple-login';

const LoginWithApple = ({ clientId, redirectURI, isLoading }) => {
  // Config check karein
  if (!clientId || !redirectURI) return null;

  return (
    <div className="apple-login-container" style={{ opacity: isLoading ? 0.6 : 1, pointerEvents: isLoading ? 'none' : 'auto' }}>
      <AppleLogin
        clientId={clientId}
        redirectURI={redirectURI}
        responseType="code"
        responseMode="form_post"
        state="restaurant" // <--- Ye restaurant ke liye fix kiya hai
        usePopup={false}    // <--- Popup use kar rahe hain taaki login ke baad page refresh na ho
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
