import Lottie from 'react-lottie';
import signInAnimData from '../assets/jsonFiles/signInAnim3.json';

function SignInAnim() {
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: signInAnimData,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice'
    }
  };

  return (
    // 'pointer-events-none' ensures the animation doesn't block the login form
    <div className="pointer-events-none flex justify-center items-center w-full">
      <Lottie 
        options={defaultOptions} 
        height="100%" 
        width="100%" 
        isClickToPauseDisabled={true}
      />
    </div>
  );
};

export default SignInAnim;